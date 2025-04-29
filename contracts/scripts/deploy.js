const hre = require("hardhat");

async function main() {
  console.log("Deploying contracts to", network.name);

  // Deploy SocialMedia contract
  const SocialMedia = await hre.ethers.getContractFactory("SocialMedia");
  const socialMedia = await SocialMedia.deploy();
  await socialMedia.deployed();
  console.log("SocialMedia deployed to:", socialMedia.address);

  // Deploy Governance contract
  const Governance = await hre.ethers.getContractFactory("Governance");
  const governance = await Governance.deploy();
  await governance.deployed();
  console.log("Governance deployed to:", governance.address);

  console.log("Deployment complete!");
  
  // Write the contract addresses to a file for frontend use
  const fs = require("fs");
  const contractAddresses = {
    SocialMedia: socialMedia.address,
    Governance: governance.address,
    chainId: network.config.chainId
  };
  
  fs.writeFileSync(
    "../frontend/src/utils/contractAddresses.json",
    JSON.stringify(contractAddresses, null, 2)
  );
  console.log("Contract addresses written to frontend/src/utils/contractAddresses.json");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
