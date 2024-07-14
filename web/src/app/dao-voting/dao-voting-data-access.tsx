import { getDaoVotingProgram, getDaoVotingProgramId } from '@dao-voting/anchor';
import { useConnection } from '@solana/wallet-adapter-react';
import { Cluster, PublicKey, SystemProgram, Keypair } from '@solana/web3.js';
import { useMutation, useQuery } from '@tanstack/react-query';
import { useMemo } from 'react';
import toast from 'react-hot-toast';
import { useCluster } from '../cluster/cluster-data-access';
import { useAnchorProvider } from '../solana/solana-provider';
import { useTransactionToast } from '../ui/ui-layout';

// Extend the types to include voteRecord
interface VoteAccounts {
  proposal: PublicKey;
  user: PublicKey;
  voteRecord: PublicKey;
  owner: PublicKey;
  systemProgram: PublicKey;
}

export function useDaoVotingProgram() {
  const { connection } = useConnection();
  const { cluster } = useCluster();
  const transactionToast = useTransactionToast();
  const provider = useAnchorProvider();
  const programId = useMemo(
    () => getDaoVotingProgramId(cluster.network as Cluster),
    [cluster]
  );
  const program = useMemo(() => getDaoVotingProgram(provider), [provider]);

  const getProgramAccount = useQuery({
    queryKey: ['get-program-account', { cluster }],
    queryFn: () => connection.getParsedAccountInfo(programId),
  });

  const createProposal = useMutation<PublicKey, Error, { title: string; description: string }>({
    mutationKey: ['daoVoting', 'createProposal', { cluster }],
    mutationFn: async ({ title, description }) => {
      const proposalAccount = Keypair.generate();
      const tx = await program.methods.createProposal(title, description).accounts({
        proposal: proposalAccount.publicKey,
        user: provider.wallet.publicKey,
        //systemProgram: SystemProgram.programId,
      }).signers([proposalAccount]).rpc();
      transactionToast(tx);
      return proposalAccount.publicKey;
    },
    onError: () => toast.error('Failed to create proposal'),
  });

  const vote = useMutation({
    mutationKey: ['daoVoting', 'vote', { cluster }],
    mutationFn: async ({ proposalPublicKey, vote }: { proposalPublicKey: PublicKey; vote: boolean }) => {
      const voteRecordAccount = Keypair.generate(); // Generate a new VoteRecord account
      const tx = await program.methods.vote(vote).accounts({
        proposal: proposalPublicKey,
        user: provider.wallet.publicKey,
        voteRecord: voteRecordAccount.publicKey, 
        owner: provider.wallet.publicKey,
        systemProgram: SystemProgram.programId,
      } as VoteAccounts).rpc();
      transactionToast(tx);
    },
    onError: () => toast.error('Failed to vote on proposal'),
  });

  const getResults = useQuery({
    queryKey: ['daoVoting', 'getResults', { cluster }],
    queryFn: async ({ queryKey }) => {
      const [, , { proposalPublicKey }] = queryKey as [string, object, { proposalPublicKey: PublicKey }];
      const proposal = await program.account.proposal.fetch(proposalPublicKey);
      return proposal;
    },
  });

  const listProposals = useQuery({
    queryKey: ['daoVoting', 'listProposals', { cluster }],
    queryFn: async () => {
      const proposals = await program.account.proposal.all();
      return proposals;
    },
    //onError: () => toast.error('Failed to fetch proposals'),
  });

  return {
    program,
    programId,
    getProgramAccount,
    createProposal,
    vote,
    getResults,
    listProposals,
  };
}
