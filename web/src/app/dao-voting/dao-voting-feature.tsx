import { AppHero } from '../ui/ui-layout';
import { useDaoVotingProgram } from './dao-voting-data-access';
import { PublicKey } from '@solana/web3.js';
import { DaoVotingListProposals, CreateProposalModal } from './dao-voting-ui';
import { useState } from 'react';
import { useWallet } from '@solana/wallet-adapter-react';

export default function DaoVotingFeature() {
  const { publicKey } = useWallet();
  const { createProposal, vote, listProposals } = useDaoVotingProgram();
  const [isCreateModalOpen, setCreateModalOpen] = useState(false);

  const handleVote = async (proposalPublicKey: PublicKey, voteValue: boolean) => {
    await vote.mutateAsync({ proposalPublicKey, vote: voteValue });
  };

  const handleCreateProposal = async (title: string, description: string) => {
    await createProposal.mutateAsync({ title, description });
    setCreateModalOpen(false);
  };

  return (
    <div>
      <AppHero title="DAO Voting" subtitle="Decentralized Autonomous Organization Voting" />
      {publicKey && (
        <button onClick={() => setCreateModalOpen(true)} className="btn btn-primary">
          Create Proposal
        </button>
      )}
      <DaoVotingListProposals onVote={handleVote} />
      <CreateProposalModal
        isOpen={isCreateModalOpen}
        onRequestClose={() => setCreateModalOpen(false)}
        onCreate={handleCreateProposal} // Pass handleCreateProposal here
      />
    </div>
  );
}
