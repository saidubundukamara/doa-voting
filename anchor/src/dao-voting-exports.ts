// Here we export some useful types and functions for interacting with the Anchor program.
import { AnchorProvider, Program } from '@coral-xyz/anchor';
import { Cluster, PublicKey } from '@solana/web3.js';
import DaoVotingIDL from '../target/idl/dao_voting.json';
import type { DaoVoting } from '../target/types/dao_voting';

// Re-export the generated IDL and type
export { DaoVoting, DaoVotingIDL };

// The programId is imported from the program IDL.
export const DAO_VOTING_PROGRAM_ID = new PublicKey(DaoVotingIDL.address);

// This is a helper function to get the DaoVoting Anchor program.
export function getDaoVotingProgram(provider: AnchorProvider) {
  return new Program(DaoVotingIDL as DaoVoting, provider);
}

// This is a helper function to get the program ID for the DaoVoting program depending on the cluster.
export function getDaoVotingProgramId(cluster: Cluster) {
  switch (cluster) {
    case 'devnet':
    case 'testnet':
    case 'mainnet-beta':
    default:
      return DAO_VOTING_PROGRAM_ID;
  }
}
