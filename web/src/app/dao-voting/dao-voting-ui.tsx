import { useState } from 'react';
import { PublicKey } from '@solana/web3.js';
import { useDaoVotingProgram } from './dao-voting-data-access';
import Modal from 'react-modal';

interface CreateProposalModalProps {
  isOpen: boolean;
  onRequestClose: () => void;
  onCreate: (title: string, description: string) => Promise<void>;
}

interface DaoVotingListProposalsProps {
  onVote: (proposalPublicKey: PublicKey, voteValue: boolean) => void;
}

export function CreateProposalModal({ isOpen, onRequestClose, onCreate }: CreateProposalModalProps) {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');

  const handleSubmit = async () => {
    await onCreate(title, description);
    onRequestClose();
  };

  return (
    <Modal isOpen={isOpen} onRequestClose={onRequestClose}>
      <h2>Create Proposal</h2>
      <form onSubmit={(e) => { e.preventDefault(); handleSubmit(); }}>
        <label>Title</label>
        <input type="text" value={title} onChange={(e) => setTitle(e.target.value)} className="w-full input input-bordered" />
        <label>Description</label>
        <textarea value={description} onChange={(e) => setDescription(e.target.value)} className="w-full textarea textarea-bordered" />
        <button type="submit" className="mt-4 btn btn-primary">
          Create Proposal
        </button>
      </form>
    </Modal>
  );
}

export function DaoVotingListProposals({ onVote }: DaoVotingListProposalsProps) {
  const { listProposals } = useDaoVotingProgram();

  if (listProposals.isLoading) {
    return <span className="loading loading-spinner loading-lg"></span>;
  }

  if (listProposals.isError) {
    return (
      <div className="alert alert-error">
        <span>Error fetching proposals</span>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {listProposals.data?.map((proposal: any) => {
        const yesVotes = typeof proposal.account.yesVotes === 'number' ? proposal.account.yesVotes : JSON.stringify(proposal.account.yesVotes);
        const noVotes = typeof proposal.account.noVotes === 'number' ? proposal.account.noVotes : JSON.stringify(proposal.account.noVotes);

        return (
          <div key={proposal.publicKey.toString()} className="flex items-center justify-between p-4 bg-white rounded-lg shadow-md">
            <div>
              <h3 className="text-lg font-semibold">{proposal.account.title}</h3>
              <p className="text-sm text-gray-600">{proposal.account.description}</p>
              <div className="flex space-x-4">
                <p className="text-sm font-bold text-green-600">Yes Votes: {yesVotes}</p>
                <p className="text-sm font-bold text-red-600">No Votes: {noVotes}</p>
              </div>
            </div>
            <div className="space-x-2">
              <button onClick={() => onVote(proposal.publicKey, true)} className="btn btn-primary">Yes</button>
              <button onClick={() => onVote(proposal.publicKey, false)} className="btn btn-secondary">No</button>
            </div>
          </div>
        );
      })}
    </div>
  );
}

export function DaoVotingCreate() {
  const { createProposal } = useDaoVotingProgram();

  return (
    <button
      className="btn btn-xs lg:btn-md btn-primary"
      onClick={() => createProposal.mutateAsync({ title: 'Sample Title', description: 'Sample Description' })}
    >
      Create Proposal
    </button>
  );
}

export function DaoVotingProgram() {
  const { getProgramAccount } = useDaoVotingProgram();

  if (getProgramAccount.isLoading) {
    return <span className="loading loading-spinner loading-lg"></span>;
  }
  if (!getProgramAccount.data?.value) {
    return (
      <div className="flex justify-center alert alert-info">
        <span>
          Program account not found. Make sure you have deployed the program and
          are on the correct cluster.
        </span>
      </div>
    );
  }
  return (
    <div className="space-y-6">
      <pre>{JSON.stringify(getProgramAccount.data.value, null, 2)}</pre>
    </div>
  );
}

export function DaoVotingPage() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const { createProposal, vote, listProposals } = useDaoVotingProgram();
  const handleVote = async (proposalPublicKey: PublicKey, voteValue: boolean) => {
    await vote.mutateAsync({ proposalPublicKey, vote: voteValue });
  };
  const handleCreateProposal = async (title: string, description: string) => {
    await createProposal.mutateAsync({ title, description });
    setIsModalOpen(false);
  };

  return (
    <div className="flex flex-col p-4 space-y-4 md:flex-row md:space-y-0 md:space-x-4">
      <div className="flex-1 space-y-4">
        <DaoVotingListProposals onVote={handleVote} />
      </div>
      <div className="flex-shrink-0">
        <div className="mb-4">
          <button onClick={() => setIsModalOpen(true)} className="btn btn-primary">Create Proposal</button>
        </div>
        <CreateProposalModal
          isOpen={isModalOpen}
          onRequestClose={() => setIsModalOpen(false)}
          onCreate={handleCreateProposal}
        />
      </div>
    </div>
  );
}
