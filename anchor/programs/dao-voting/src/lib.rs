use anchor_lang::prelude::*;

declare_id!("DCcTCtHFnnR79pvJEY99teLpj2rpwjwS3FZkGjBZEaE5");

#[program]
pub mod dao_voting {
    use super::*;

    pub fn create_proposal(ctx: Context<CreateProposal>, title: String, description: String) -> Result<()> {
        let proposal = &mut ctx.accounts.proposal;
        proposal.title = title;
        proposal.description = description;
        proposal.yes_votes = 0;
        proposal.no_votes = 0;
        Ok(())
    }

    pub fn vote(ctx: Context<Vote>, vote: bool) -> Result<()> {
        let proposal = &mut ctx.accounts.proposal;
        let user = &mut ctx.accounts.user;
        let vote_record = &mut ctx.accounts.vote_record;

        if vote_record.has_voted {
            return Err(ErrorCode::AlreadyVoted.into());
        }

        if vote {
            proposal.yes_votes += 1;
        } else {
            proposal.no_votes += 1;
        }

        vote_record.has_voted = true;
        user.reward_points += 1;
        Ok(())
    }

    pub fn get_results(ctx: Context<GetResults>) -> Result<()> {
        let proposal = &ctx.accounts.proposal;
        msg!("Yes votes: {}", proposal.yes_votes);
        msg!("No votes: {}", proposal.no_votes);
        Ok(())
    }

    pub fn create_user(ctx: Context<CreateUser>) -> Result<()> {
        let user = &mut ctx.accounts.user;
        user.reward_points = 0;
        Ok(())
    }
}

#[derive(Accounts)]
pub struct CreateProposal<'info> {
    #[account(init, payer = user, space = 8 + 40 + 200 + 8 + 8)]
    pub proposal: Account<'info, Proposal>,
    #[account(mut)]
    pub user: Signer<'info>,
    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct Vote<'info> {
    #[account(mut)]
    pub proposal: Account<'info, Proposal>,
    #[account(mut)]
    pub user: Account<'info, User>,
    #[account(init, payer = owner, space = 8 + 1, seeds = [user.key().as_ref(), proposal.key().as_ref()], bump)]
    pub vote_record: Account<'info, VoteRecord>,
    #[account(mut)]
    pub owner: Signer<'info>,
    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct GetResults<'info> {
    pub proposal: Account<'info, Proposal>,
}

#[derive(Accounts)]
pub struct CreateUser<'info> {
    #[account(init, payer = owner, space = 8 + 8)]
    pub user: Account<'info, User>,
    #[account(mut)]
    pub owner: Signer<'info>,
    pub system_program: Program<'info, System>,
}

#[account]
pub struct Proposal {
    pub title: String,
    pub description: String,
    pub yes_votes: u64,
    pub no_votes: u64,
}

#[account]
pub struct User {
    pub reward_points: u64,
}

#[account]
pub struct VoteRecord {
    pub has_voted: bool,
}

#[error_code]pub enum ErrorCode {
    #[msg("User has already voted on this proposal.")]
    AlreadyVoted,
    #[msg("The given account is owned by a different program than expected.")]
    AccountOwnedByWrongProgram,
}
