import * as anchor from '@coral-xyz/anchor';
import { Program } from '@coral-xyz/anchor';
import { DaoVoting } from '../target/types/dao_voting';
import { assert } from 'chai';

describe('dao-voting', () => {
  const provider = anchor.AnchorProvider.local();
  anchor.setProvider(provider);

  const program = anchor.workspace.DaoVoting as Program<DaoVoting>;
  const user = anchor.web3.Keypair.generate();

  before(async () => {
    await provider.connection.requestAirdrop(user.publicKey, anchor.web3.LAMPORTS_PER_SOL);
  });

  it('should create a proposal', async () => {
    const proposal = anchor.web3.Keypair.generate();

    // Create a proposal
    await program.methods.createProposal('Test Proposal', 'This is a test proposal')
      .accounts({
        proposal: proposal.publicKey,
        user: user.publicKey,
        //systemProgram: anchor.web3.SystemProgram.programId,
      })
      .signers([user, proposal])
      .rpc();

    const proposalAccount = await program.account.proposal.fetch(proposal.publicKey);
    assert.equal(proposalAccount.title, 'Test Proposal');
    assert.equal(proposalAccount.description, 'This is a test proposal');
    assert.equal(proposalAccount.yesVotes.toNumber(), 0);
    assert.equal(proposalAccount.noVotes.toNumber(), 0);
  });

  it('should allow a user to vote', async () => {
    const proposal = anchor.web3.Keypair.generate();

    await program.methods.createProposal('Test Proposal', 'This is a test proposal')
      .accounts({
        proposal: proposal.publicKey,
        user: user.publicKey,
        //systemProgram: anchor.web3.SystemProgram.programId,
      })
      .signers([user, proposal])
      .rpc();

    const voter = anchor.web3.Keypair.generate();
    await provider.connection.requestAirdrop(voter.publicKey, anchor.web3.LAMPORTS_PER_SOL);

    await program.methods.createUser()
      .accounts({
        user: voter.publicKey,
        owner: voter.publicKey,
        //systemProgram: anchor.web3.SystemProgram.programId,
      })
      .signers([voter])
      .rpc();

    await program.methods.vote(true)
      .accounts({
        proposal: proposal.publicKey,
        user: voter.publicKey,
        owner: voter.publicKey,
        //systemProgram: anchor.web3.SystemProgram.programId,
      })
      .signers([voter])
      .rpc();

    const proposalAccount = await program.account.proposal.fetch(proposal.publicKey);
    const userAccount = await program.account.user.fetch(voter.publicKey);
    assert.equal(proposalAccount.yesVotes.toNumber(), 1);
    assert.equal(proposalAccount.noVotes.toNumber(), 0);
    assert.equal(userAccount.rewardPoints.toNumber(), 1);
  });

  it('should get the results of a proposal', async () => {
    const proposal = anchor.web3.Keypair.generate();

    await program.methods.createProposal('Test Proposal', 'This is a test proposal')
      .accounts({
        proposal: proposal.publicKey,
        user: user.publicKey,
        //systemProgram: anchor.web3.SystemProgram.programId,
      })
      .signers([user, proposal])
      .rpc();

    const voter = anchor.web3.Keypair.generate();
    await provider.connection.requestAirdrop(voter.publicKey, anchor.web3.LAMPORTS_PER_SOL);

    await program.methods.createUser()
      .accounts({
        user: voter.publicKey,
        owner: voter.publicKey,
        //systemProgram: anchor.web3.SystemProgram.programId,
      })
      .signers([voter])
      .rpc();

    await program.methods.vote(true)
      .accounts({
        proposal: proposal.publicKey,
        user: voter.publicKey,
        owner: voter.publicKey,
        //systemProgram: anchor.web3.SystemProgram.programId,
      })
      .signers([voter])
      .rpc();

    // Get the results of the proposal
    await program.methods.getResults()
      .accounts({
        proposal: proposal.publicKey,
      })
      .rpc();

    // Here you could add more validation if needed, like checking logs
  });
});
