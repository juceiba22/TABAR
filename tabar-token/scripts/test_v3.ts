import { network } from 'hardhat';
async function f() {
  const conn = await network.create();
  console.log(Object.keys(conn));
}
f();
