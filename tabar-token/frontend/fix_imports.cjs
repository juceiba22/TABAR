const fs = require('fs');
const path = require('path');
const files = [
    'src/pages/state/returns.jsx',
    'src/pages/state/dashboard.jsx',
    'src/pages/LandingRole.jsx',
    'src/pages/industry/position.jsx',
    'src/pages/industry/dashboard.jsx',
    'src/pages/dealer/dashboard.jsx',
    'src/modules/blockchain/useTabar.js',
    'src/App.jsx',
    'src/pages/admin/control.jsx'
];

files.forEach(f => {
    const p = path.join(process.cwd(), f);
    if (!fs.existsSync(p)) return;
    let c = fs.readFileSync(p, 'utf8');
    c = c.replace('import { privateKeyToAccount } from "viem";', 'import { privateKeyToAccount } from "viem/accounts";');
    c = c.replace("await import('viem');", "await import('viem/accounts');");
    fs.writeFileSync(p, c);
});
