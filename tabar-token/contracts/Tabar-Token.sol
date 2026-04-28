// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/access/AccessControl.sol";
import "@openzeppelin/contracts/utils/Pausable.sol";

/**
 * TABAR Token - AgroTabaco Labs
 * 1 TABAR = 1 Fardo de tabaco (200kg)
 * Sistema de financiamiento agroindustrial aplicado al tabaco
 */
contract TabarToken is ERC20, AccessControl, Pausable {

    // ── Roles del sistema ──────────────────────────────────────────
    bytes32 public constant ACOPIADOR_ROLE  = keccak256("ACOPIADOR_ROLE");
    bytes32 public constant FIDEICOMISO_ROLE = keccak256("FIDEICOMISO_ROLE");

    // ── Constantes del negocio ─────────────────────────────────────
    uint256 public constant KG_POR_FARDO = 200;
    uint256 public constant DECIMALES_TABACO = 0; // 1 token = 1 fardo entero

    // ── Estado de la campaña ───────────────────────────────────────
    bool public campanaActiva;
    uint256 public totalFardosEmitidos;
    uint256 public inicioCampana;
    uint256 public finCampana;

    // ── Wallets autorizadas (adquisición cerrada) ──────────────────
    mapping(address => bool) public walletAutorizada;
    mapping(address => TipoInversor) public tipoInversor;
    mapping(address => uint256) public tokensAdquiridos;

    // ── Tipos de inversores según el documento ─────────────────────
    enum TipoInversor {
        SIN_ASIGNAR,
        EXPORTADOR,
        INDUSTRIAL,
        DEALER,
        ESTADO_NACIONAL  // para el FET
    }

    // ── Registro de lotes de tabaco ────────────────────────────────
    struct LoteTabaco {
        uint256 idLote;
        uint256 cantidadFardos;
        string ubicacionDeposito;
        bool warrantyActivo;
        address acopiadorEmitor;
    }

    mapping(uint256 => LoteTabaco) public lotes;
    uint256 public totalLotes;

    // ── Eventos ────────────────────────────────────────────────────
    event CampanaIniciada(uint256 timestamp, uint256 totalTokens);
    event CampanaCerrada(uint256 timestamp, uint256 tokensQuemados);
    event WalletAutorizada(address wallet, TipoInversor tipo);
    event WalletRevocada(address wallet);
    event LoteRegistrado(uint256 idLote, uint256 fardos, string deposito);
    event TokenesEntregados(address inversor, uint256 cantidad, TipoInversor tipo);
    event TokenesRedimidos(address inversor, uint256 cantidad);

    // ── Constructor ────────────────────────────────────────────────
    constructor(address _fideicomiso) ERC20("TABAR", "TAB") {
        _grantRole(DEFAULT_ADMIN_ROLE, msg.sender);
        _grantRole(FIDEICOMISO_ROLE, _fideicomiso);
        campanaActiva = false;
    }

    // ── Modificadores ──────────────────────────────────────────────
    modifier soloCampanaActiva() {
        require(campanaActiva, "No hay campana activa");
        _;
    }

    modifier soloWalletAutorizada(address _wallet) {
        require(walletAutorizada[_wallet], "Wallet no autorizada");
        _;
    }

    // ── Gestión de campaña ─────────────────────────────────────────

    /**
     * Inicia una nueva campaña y emite los tokens
     * Solo el fideicomiso puede llamar esta función
     * @param _totalFardos cantidad total de fardos a tokenizar
     * @param _duracionDias duración de la campaña en días
     */
    function iniciarCampana(
        uint256 _totalFardos,
        uint256 _duracionDias
    ) external onlyRole(FIDEICOMISO_ROLE) {
        require(!campanaActiva, "Ya hay una campana activa");
        require(_totalFardos > 0, "Debe haber al menos un fardo");

        campanaActiva = true;
        totalFardosEmitidos = _totalFardos;
        inicioCampana = block.timestamp;
        finCampana = block.timestamp + (_duracionDias * 1 days);

        // Minta los tokens al contrato mismo (no al mercado directamente)
        _mint(address(this), _totalFardos);

        emit CampanaIniciada(block.timestamp, _totalFardos);
    }

    /**
     * Cierra la campaña y quema los tokens no redimidos
     */
    function cerrarCampana() external onlyRole(FIDEICOMISO_ROLE) soloCampanaActiva {
        uint256 tokensRestantes = balanceOf(address(this));
        campanaActiva = false;

        if (tokensRestantes > 0) {
            _burn(address(this), tokensRestantes);
        }

        emit CampanaCerrada(block.timestamp, tokensRestantes);
    }

    // ── Gestión de wallets autorizadas ─────────────────────────────

    /**
     * Autoriza una wallet para participar en el sistema
     * Solo el administrador (fideicomiso) puede autorizar
     */
    function autorizarWallet(
        address _wallet,
        TipoInversor _tipo
    ) external onlyRole(FIDEICOMISO_ROLE) {
        require(_wallet != address(0), "Direccion invalida");
        walletAutorizada[_wallet] = true;
        tipoInversor[_wallet] = _tipo;
        emit WalletAutorizada(_wallet, _tipo);
    }

    function revocarWallet(address _wallet) external onlyRole(FIDEICOMISO_ROLE) {
        walletAutorizada[_wallet] = false;
        emit WalletRevocada(_wallet);
    }

    // ── Distribución de tokens ─────────────────────────────────────

    /**
     * Entrega tokens a un inversor autorizado
     * @param _inversor dirección del inversor
     * @param _cantidad cantidad de fardos (tokens)
     */
    function entregarTokens(
        address _inversor,
        uint256 _cantidad
    ) external onlyRole(ACOPIADOR_ROLE) soloCampanaActiva soloWalletAutorizada(_inversor) {
        require(balanceOf(address(this)) >= _cantidad, "No hay suficientes tokens");

        tokensAdquiridos[_inversor] += _cantidad;
        _transfer(address(this), _inversor, _cantidad);

        emit TokenesEntregados(_inversor, _cantidad, tipoInversor[_inversor]);
    }

    /**
     * El inversor redime sus tokens (los canjea por tabaco o rendimiento)
     */
    function redimirTokens(uint256 _cantidad) external soloCampanaActiva soloWalletAutorizada(msg.sender) {
        require(balanceOf(msg.sender) >= _cantidad, "Saldo insuficiente");

        _burn(msg.sender, _cantidad);
        tokensAdquiridos[msg.sender] -= _cantidad;

        emit TokenesRedimidos(msg.sender, _cantidad);
    }

    // ── Registro de lotes físicos ──────────────────────────────────

    /**
     * Registra un lote físico de tabaco con su warrant
     */
    function registrarLote(
        uint256 _cantidadFardos,
        string memory _ubicacion
    ) external onlyRole(ACOPIADOR_ROLE) returns (uint256) {
        totalLotes++;
        lotes[totalLotes] = LoteTabaco({
            idLote: totalLotes,
            cantidadFardos: _cantidadFardos,
            ubicacionDeposito: _ubicacion,
            warrantyActivo: true,
            acopiadorEmitor: msg.sender
        });

        emit LoteRegistrado(totalLotes, _cantidadFardos, _ubicacion);
        return totalLotes;
    }

    // ── Override de transferencias (sin mercado secundario) ────────

    /**
     * Bloquea transferencias entre usuarios no autorizados
     * Implementa la restricción de "sin mercado secundario"
     */
    function _update(
        address from,
        address to,
        uint256 amount
    ) internal override whenNotPaused {
        // Permitir: mint (from = 0), burn (to = 0), y desde/hacia el contrato
        bool esMint = (from == address(0));
        bool esBurn = (to == address(0));
        bool esDesdeContrato = (from == address(this));

        if (!esMint && !esBurn && !esDesdeContrato) {
            // Transferencia entre usuarios: ambos deben estar autorizados
            require(walletAutorizada[from], "Origen no autorizado");
            require(walletAutorizada[to], "Destino no autorizado");
        }

        super._update(from, to, amount);
    }

    // ── Funciones de consulta ──────────────────────────────────────

    function decimals() public pure override returns (uint8) {
        return 0; // Sin decimales: 1 token = 1 fardo entero
    }

    function consultarCampana() external view returns (
        bool activa,
        uint256 totalEmitidos,
        uint256 enCirculacion,
        uint256 inicio,
        uint256 fin
    ) {
        return (
            campanaActiva,
            totalFardosEmitidos,
            totalFardosEmitidos - balanceOf(address(this)),
            inicioCampana,
            finCampana
        );
    }

    function pausar() external onlyRole(DEFAULT_ADMIN_ROLE) {
        _pause();
    }

    function reanudar() external onlyRole(DEFAULT_ADMIN_ROLE) {
        _unpause();
    }
}