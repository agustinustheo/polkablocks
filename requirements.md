# Project Requirements: Pangea
## 1. Overview
This document outlines the functional and technical requirements for "Pangea," a platform designed to tokenize real-world assets (e.g., houses, cars, collectibles) on the Polkadot network. The system will leverage smart contracts to manage asset ownership and transactions, and an off-chain storage solution for immutable, digitally signed PDF documents containing the asset's detailed metadata.

## 2. Functional Requirements
### 2.1 Asset Creation & Tokenization
- R1.1: A verified user (e.g., a seller, asset creator) must be able to create a new digital asset (a non-fungible token or NFT) on the Polkadot blockchain.

- R1.2: The user must be able to upload a digitally signed, immutable PDF document containing the asset's metadata (e.g., VIN for a car, legal deed for a house, certificate of authenticity for a collectible).

- R1.3: The smart contract must store a cryptographic hash of the PDF document on-chain to ensure immutability and data integrity.

- R1.4: The on-chain asset (NFT) must contain a link or identifier to the off-chain stored PDF.

### 2.2 Asset Transfer & Transaction
- R2.1: The system must facilitate peer-to-peer transfer of the tokenized asset (NFT) from one owner to another.

- R2.2: The transfer must be initiated by a signed transaction from the current asset owner's wallet.

- R2.3: Upon successful transfer, the smart contract must automatically update the on-chain ownership record.

- R2.4: The system must require a new signed PDF document from all relevant parties (e.g., buyer and seller) for each change of ownership. A new hash of this document must be recorded on-chain.

### 2.3 Document Management
- R3.1: The system must provide a secure and verifiable method for users to digitally sign PDF documents.

- R3.2: The system must store the signed PDF documents off-chain on a decentralized file storage system (e.g., IPFS) to ensure immutability and accessibility.

- R3.3: Any user must be able to retrieve and view the PDF document associated with a specific asset using the on-chain link/identifier.

- R3.4: The system must have a function to verify that the retrieved PDF document's hash matches the one stored on the blockchain.

## 3. Technical Requirements
### 3.1 Blockchain and Smart Contracts
- T1.1: The smart contracts must be built using the Polkadot SDK and the Ink! language, and deployed on a Polkadot-compatible parachain that supports smart contracts.

- T1.2: The smart contracts must handle the logic for asset creation, ownership transfer, and document hash storage.

- T1.3: A custom pallet may be required for complex features, such as integrating with real-world identity solutions or oracles for asset valuation.

### 3.2 Frontend/User Interface
- T2.1: A web-based application must be developed to interact with the smart contracts.

- T2.2: The application must integrate with a Polkadot-compatible wallet (e.g., Polkadot.js) for user authentication and transaction signing.

- T2.3: The UI must be intuitive, guiding users through asset creation, document upload, and transaction processes.

### 3.3 Data Storage
- T3.1: PDF documents must be stored on IPFS or a similar decentralized, content-addressed storage system.

- T3.2: The smart contract should store the IPFS CID (Content Identifier) of the PDF document.

### 4. Non-Functional Requirements
- N1.1 Security: All smart contracts must be thoroughly audited for security vulnerabilities before deployment to the mainnet.

- N1.2 Scalability: The chosen parachain must be able to handle a high volume of transactions without significant performance degradation.

- N1.3 Usability: The user interface should be simple enough for non-technical users to navigate the asset tokenization and transfer process.

- N1.4 Immutability: The on-chain record and off-chain PDF documents must be tamper-proof and immutable.

### 5. Actors
- Asset Owner: A user who possesses a tokenized asset.

- Potential Buyer: A user who wishes to acquire a tokenized asset.

- Asset Issuer: The original creator or legal entity that tokenizes the real-world asset.

- Notary/Verifier (Optional): A trusted third party who can sign documents to verify their authenticity.
