//! Standardized event types for on-chain action logging
//!
//! This module provides consistent event structures for off-chain indexing
//! and notification systems. All contracts should use these event types
//! to ensure reliable backend integration.

use soroban_sdk::{
    contractevent, contracttype, Address, Env, Symbol, String, Vec, Map, 
    symbol_short, IntoVal
};

// =============================================================================
// Event Topics (standardized event names)
// =============================================================================

/// Standard event topic names for consistent indexing
pub mod topics {
    use soroban_sdk::{symbol_short, Symbol};

    // Core token events
    pub const TRANSFER: Symbol = symbol_short!("transfer");
    pub const APPROVE: Symbol = symbol_short!("approve");
    pub const MINT: Symbol = symbol_short!("mint");
    pub const BURN: Symbol = symbol_short!("burn");

    // Trading events
    pub const TRADE_EXECUTED: Symbol = symbol_short!("trade");
    pub const CONTRACT_PAUSED: Symbol = symbol_short!("paused");
    pub const CONTRACT_UNPAUSED: Symbol = symbol_short!("unpause");
    pub const FEE_COLLECTED: Symbol = symbol_short!("fee");

    // Staking events
    pub const STAKE: Symbol = symbol_short!("stake");
    pub const UNSTAKE: Symbol = symbol_short!("unstake");
    pub const REWARDS_CLAIMED: Symbol = symbol_short!("rewards_claimed");
    pub const POOL_UPDATED: Symbol = symbol_short!("pool_updated");

    // Governance events
    pub const PROPOSAL_CREATED: Symbol = symbol_short!("propose");
    pub const PROPOSAL_APPROVED: Symbol = symbol_short!("approve");
    pub const PROPOSAL_REJECTED: Symbol = symbol_short!("reject");
    pub const PROPOSAL_EXECUTED: Symbol = symbol_short!("execute");
    pub const PROPOSAL_CANCELLED: Symbol = symbol_short!("cancel");
    pub const VOTE: Symbol = symbol_short!("vote");

    // Admin and authorization events
    pub const ADMIN_CHANGED: Symbol = symbol_short!("admin_changed");
    pub const AUTHORIZATION_CHANGED: Symbol = symbol_short!("auth_changed");
    pub const EMERGENCY_MODE: Symbol = symbol_short!("emergency_mode");

    // Oracle events
    pub const ORACLE_UPDATED: Symbol = symbol_short!("oracle_updated");

    // Upgrade events
    pub const UPGRADE_PROPOSED: Symbol = symbol_short!("upgrade_proposed");
    pub const UPGRADE_EXECUTED: Symbol = symbol_short!("upgrade_executed");

    // Social rewards events
    pub const REWARD_ADDED: Symbol = symbol_short!("reward");
    pub const REWARD_CLAIMED: Symbol = symbol_short!("claimed");
}

// =============================================================================
// Standardized Event Structure
// =============================================================================

/// Standardized event structure for all Stellara contracts
/// This ensures consistent event formatting for off-chain indexing
#[contractevent]
#[derive(Clone, Debug, Eq, PartialEq)]
pub struct StandardEvent {
    /// Event type identifier (e.g., "transfer", "stake", "vote")
    pub event_type: Symbol,
    /// Contract address that emitted the event
    pub contract_address: Address,
    /// User address that triggered the event (if applicable)
    pub user_address: Option<Address>,
    /// Event data payload
    pub data: Vec<Symbol>,
    /// Additional metadata for indexing
    pub metadata: Map<Symbol, Vec<Symbol>>,
    /// Timestamp when the event occurred
    pub timestamp: u64,
    /// Event version for schema evolution
    pub version: u32,
}

// =============================================================================
// Trading Events
// =============================================================================

/// Event emitted when a trade is executed
#[contracttype]
#[derive(Clone, Debug)]
pub struct TradeExecutedEvent {
    /// Unique trade identifier
    pub trade_id: u64,
    /// Address of trader
    pub trader: Address,
    /// Trading pair symbol (e.g., "XLMUSDC")
    pub pair: Symbol,
    /// Trade amount
    pub amount: i128,
    /// Trade price
    pub price: i128,
    /// Whether this is a buy (true) or sell (false)
    pub is_buy: bool,
    /// Fee amount collected
    pub fee_amount: i128,
    /// Token used for fee payment
    pub fee_token: Address,
    /// Block timestamp when trade occurred
    pub timestamp: u64,
}

/// Event emitted when contract is paused
#[contracttype]
#[derive(Clone, Debug)]
pub struct ContractPausedEvent {
    /// Admin who paused contract
    pub paused_by: Address,
    /// Block timestamp when paused
    pub timestamp: u64,
}

/// Event emitted when contract is unpaused
#[contracttype]
#[derive(Clone, Debug)]
pub struct ContractUnpausedEvent {
    /// Admin who unpaused contract
    pub unpaused_by: Address,
    /// Block timestamp when unpaused
    pub timestamp: u64,
}

/// Event emitted when a fee is collected
#[contracttype]
#[derive(Clone, Debug)]
pub struct FeeCollectedEvent {
    /// Address paying the fee
    pub payer: Address,
    /// Address receiving the fee
    pub recipient: Address,
    /// Fee amount
    pub amount: i128,
    /// Token used for payment
    pub token: Address,
    /// Block timestamp
    pub timestamp: u64,
}

// =============================================================================
// Governance Events
// =============================================================================

/// Event emitted when an upgrade proposal is created
#[contracttype]
#[derive(Clone, Debug)]
pub struct ProposalCreatedEvent {
    /// Unique proposal identifier
    pub proposal_id: u64,
    /// Address that created the proposal
    pub proposer: Address,
    /// Hash of the new contract to upgrade to
    pub new_contract_hash: Symbol,
    /// Contract being upgraded
    pub target_contract: Address,
    /// Description of the proposal
    pub description: Symbol,
    /// Required approvals for execution
    pub approval_threshold: u32,
    /// Timelock delay before execution (seconds)
    pub timelock_delay: u64,
    /// Block timestamp when created
    pub timestamp: u64,
}

/// Event emitted when a proposal is approved
#[contracttype]
#[derive(Clone, Debug)]
pub struct ProposalApprovedEvent {
    /// Proposal identifier
    pub proposal_id: u64,
    /// Address that approved
    pub approver: Address,
    /// Current approval count after this approval
    pub current_approvals: u32,
    /// Required approvals for execution
    pub threshold: u32,
    /// Block timestamp
    pub timestamp: u64,
}

/// Event emitted when a proposal is rejected
#[contracttype]
#[derive(Clone, Debug)]
pub struct ProposalRejectedEvent {
    /// Proposal identifier
    pub proposal_id: u64,
    /// Address that rejected
    pub rejector: Address,
    /// Block timestamp
    pub timestamp: u64,
}

/// Event emitted when a proposal is executed
#[contracttype]
#[derive(Clone, Debug)]
pub struct ProposalExecutedEvent {
    /// Proposal identifier
    pub proposal_id: u64,
    /// Address that executed
    pub executor: Address,
    /// New contract hash that was deployed
    pub new_contract_hash: Symbol,
    /// Block timestamp
    pub timestamp: u64,
}

/// Event emitted when a proposal is cancelled
#[contracttype]
#[derive(Clone, Debug)]
pub struct ProposalCancelledEvent {
    /// Proposal identifier
    pub proposal_id: u64,
    /// Admin who cancelled
    pub cancelled_by: Address,
    /// Block timestamp
    pub timestamp: u64,
}

// =============================================================================
// Social Rewards Events
// =============================================================================

/// Event emitted when a reward is added/granted to a user
#[contracttype]
#[derive(Clone, Debug)]
pub struct RewardAddedEvent {
    /// Unique reward identifier
    pub reward_id: u64,
    /// User receiving the reward
    pub user: Address,
    /// Reward amount
    pub amount: i128,
    /// Type of reward (e.g., "referral", "engagement", "achievement")
    pub reward_type: Symbol,
    /// Optional metadata/reason for the reward
    pub reason: Symbol,
    /// Admin who granted the reward
    pub granted_by: Address,
    /// Block timestamp
    pub timestamp: u64,
}

/// Event emitted when a reward is claimed
#[contracttype]
#[derive(Clone, Debug)]
pub struct RewardClaimedEvent {
    /// Reward identifier
    pub reward_id: u64,
    /// User who claimed
    pub user: Address,
    /// Amount claimed
    pub amount: i128,
    /// Block timestamp
    pub timestamp: u64,
}

// =============================================================================
// Event Emission Helpers
// =============================================================================

use soroban_sdk::Env;

/// Helper trait for emitting standardized events
pub struct EventEmitter;

impl EventEmitter {
    /// Current event schema version
    pub const CURRENT_VERSION: u32 = 1;
    
    /// Standard metadata keys for consistent indexing
    pub const AMOUNT_KEY: Symbol = symbol_short!("amount");
    pub const FROM_KEY: Symbol = symbol_short!("from");
    pub const TO_KEY: Symbol = symbol_short!("to");
    pub const TOKEN_KEY: Symbol = symbol_short!("token");
    pub const PAIR_KEY: Symbol = symbol_short!("pair");
    pub const PRICE_KEY: Symbol = symbol_short!("price");
    pub const FEE_KEY: Symbol = symbol_short!("fee");
    pub const REASON_KEY: Symbol = symbol_short!("reason");
    pub const PROPOSAL_ID_KEY: Symbol = symbol_short!("proposal_id");
    pub const VOTE_TYPE_KEY: Symbol = symbol_short!("vote_type");
    pub const LOCK_PERIOD_KEY: Symbol = symbol_short!("lock_period");
    pub const REWARD_RATE_KEY: Symbol = symbol_short!("reward_rate");

    /// Emit a standardized event
    pub fn emit_standard(
        env: &Env,
        event_type: Symbol,
        user_address: Option<Address>,
        data: Vec<Symbol>,
        metadata: Map<Symbol, Vec<Symbol>>,
    ) {
        let event = StandardEvent {
            event_type,
            contract_address: env.current_contract_address(),
            user_address,
            data,
            metadata,
            timestamp: env.ledger().timestamp(),
            version: Self::CURRENT_VERSION,
        };

        env.events().publish(
            (symbol_short!("stellara_event"), event.event_type),
            (event.contract_address, event.user_address, event.data, event.metadata, event.timestamp, event.version),
        );
    }

    /// Emit a transfer event using standardized format
    pub fn transfer(env: &Env, from: Address, to: Address, amount: i128, token: Address) {
        let mut data = Vec::new(env);
        data.push_back(amount.into_val(env));
        data.push_back(token.into_val(env));

        let mut metadata = Map::new(env);
        metadata.set(Self::FROM_KEY, Vec::from_array(env, [from.into_val(env)]));
        metadata.set(Self::TO_KEY, Vec::from_array(env, [to.into_val(env)]));
        metadata.set(Self::AMOUNT_KEY, Vec::from_array(env, [amount.into_val(env)]));
        metadata.set(Self::TOKEN_KEY, Vec::from_array(env, [token.into_val(env)]));

        Self::emit_standard(env, topics::TRANSFER, Some(from), data, metadata);
        
        // Also emit legacy event for backward compatibility
        env.events().publish(
            (topics::TRANSFER, from, to),
            amount,
        );
    }

    /// Emit an approval event using standardized format
    pub fn approve(env: &Env, owner: Address, spender: Address, amount: i128, token: Address) {
        let mut data = Vec::new(env);
        data.push_back(amount.into_val(env));
        data.push_back(token.into_val(env));

        let mut metadata = Map::new(env);
        metadata.set(Self::FROM_KEY, Vec::from_array(env, [owner.into_val(env)]));
        metadata.set(Self::TO_KEY, Vec::from_array(env, [spender.into_val(env)]));
        metadata.set(Self::AMOUNT_KEY, Vec::from_array(env, [amount.into_val(env)]));
        metadata.set(Self::TOKEN_KEY, Vec::from_array(env, [token.into_val(env)]));

        Self::emit_standard(env, topics::APPROVE, Some(owner), data, metadata);
        
        // Also emit legacy event for backward compatibility
        env.events().publish(
            (topics::APPROVE, owner, spender),
            amount,
        );
    }

    /// Emit a mint event using standardized format
    pub fn mint(env: &Env, to: Address, amount: i128, token: Address, reason: Option<String>) {
        let mut data = Vec::new(env);
        data.push_back(amount.into_val(env));
        data.push_back(token.into_val(env));
        if let Some(r) = reason {
            data.push_back(Symbol::new(env, &r).into_val(env));
        }

        let mut metadata = Map::new(env);
        metadata.set(Self::TO_KEY, Vec::from_array(env, [to.into_val(env)]));
        metadata.set(Self::AMOUNT_KEY, Vec::from_array(env, [amount.into_val(env)]));
        metadata.set(Self::TOKEN_KEY, Vec::from_array(env, [token.into_val(env)]));
        if let Some(r) = reason {
            metadata.set(Self::REASON_KEY, Vec::from_array(env, [Symbol::new(env, &r).into_val(env)]));
        }

        Self::emit_standard(env, topics::MINT, Some(to), data, metadata);
        
        // Also emit legacy event for backward compatibility
        env.events().publish(
            (topics::MINT, to),
            amount,
        );
    }

    /// Emit a burn event using standardized format
    pub fn burn(env: &Env, from: Address, amount: i128, token: Address) {
        let mut data = Vec::new(env);
        data.push_back(amount.into_val(env));
        data.push_back(token.into_val(env));

        let mut metadata = Map::new(env);
        metadata.set(Self::FROM_KEY, Vec::from_array(env, [from.into_val(env)]));
        metadata.set(Self::AMOUNT_KEY, Vec::from_array(env, [amount.into_val(env)]));
        metadata.set(Self::TOKEN_KEY, Vec::from_array(env, [token.into_val(env)]));

        Self::emit_standard(env, topics::BURN, Some(from), data, metadata);
        
        // Also emit legacy event for backward compatibility
        env.events().publish(
            (topics::BURN, from),
            amount,
        );
    }

    /// Emit a staking event using standardized format
    pub fn stake(env: &Env, user: Address, amount: i128, lock_period: u64, token: Address) {
        let mut data = Vec::new(env);
        data.push_back(amount.into_val(env));
        data.push_back(lock_period.into_val(env));
        data.push_back(token.into_val(env));

        let mut metadata = Map::new(env);
        metadata.set(Self::AMOUNT_KEY, Vec::from_array(env, [amount.into_val(env)]));
        metadata.set(Self::LOCK_PERIOD_KEY, Vec::from_array(env, [lock_period.into_val(env)]));
        metadata.set(Self::TOKEN_KEY, Vec::from_array(env, [token.into_val(env)]));

        Self::emit_standard(env, topics::STAKE, Some(user), data, metadata);
        
        // Also emit legacy event for backward compatibility
        env.events().publish(
            (topics::STAKE, user),
            (amount, lock_period, env.ledger().timestamp()),
        );
    }

    /// Emit an unstaking event using standardized format
    pub fn unstake(env: &Env, user: Address, amount: i128, rewards: i128, fee: i128, token: Address) {
        let mut data = Vec::new(env);
        data.push_back(amount.into_val(env));
        data.push_back(rewards.into_val(env));
        data.push_back(fee.into_val(env));
        data.push_back(token.into_val(env));

        let mut metadata = Map::new(env);
        metadata.set(Self::AMOUNT_KEY, Vec::from_array(env, [amount.into_val(env)]));
        metadata.set(Self::FEE_KEY, Vec::from_array(env, [fee.into_val(env)]));
        metadata.set(Self::TOKEN_KEY, Vec::from_array(env, [token.into_val(env)]));

        Self::emit_standard(env, topics::UNSTAKE, Some(user), data, metadata);
        
        // Also emit legacy event for backward compatibility
        env.events().publish(
            (topics::UNSTAKE, user),
            (amount, rewards, fee, env.ledger().timestamp()),
        );
    }

    /// Emit a rewards claimed event using standardized format
    pub fn rewards_claimed(env: &Env, user: Address, base_rewards: i128, bonus_rewards: i128, token: Address) {
        let mut data = Vec::new(env);
        data.push_back(base_rewards.into_val(env));
        data.push_back(bonus_rewards.into_val(env));
        data.push_back(token.into_val(env));

        let mut metadata = Map::new(env);
        metadata.set(Self::AMOUNT_KEY, Vec::from_array(env, [(base_rewards + bonus_rewards).into_val(env)]));
        metadata.set(Self::TOKEN_KEY, Vec::from_array(env, [token.into_val(env)]));

        Self::emit_standard(env, topics::REWARDS_CLAIMED, Some(user), data, metadata);
        
        // Also emit legacy event for backward compatibility
        env.events().publish(
            (topics::REWARDS_CLAIMED, user),
            (base_rewards, bonus_rewards, env.ledger().timestamp()),
        );
    }

    /// Emit a voting event using standardized format
    pub fn vote(env: &Env, voter: Address, proposal_id: u64, vote_type: Symbol, voting_power: u128) {
        let mut data = Vec::new(env);
        data.push_back(proposal_id.into_val(env));
        data.push_back(vote_type.into_val(env));
        data.push_back(voting_power.into_val(env));

        let mut metadata = Map::new(env);
        metadata.set(Self::PROPOSAL_ID_KEY, Vec::from_array(env, [proposal_id.into_val(env)]));
        metadata.set(Self::VOTE_TYPE_KEY, Vec::from_array(env, [vote_type.into_val(env)]));

        Self::emit_standard(env, topics::VOTE, Some(voter), data, metadata);
        
        // Also emit legacy event for backward compatibility
        env.events().publish(
            (topics::VOTE, voter),
            (proposal_id, vote_type, voting_power, env.ledger().timestamp()),
        );
    }

    /// Emit an admin change event using standardized format
    pub fn admin_changed(env: &Env, old_admin: Address, new_admin: Address) {
        let mut data = Vec::new(env);
        data.push_back(old_admin.into_val(env));
        data.push_back(new_admin.into_val(env));

        let mut metadata = Map::new(env);
        metadata.set(Self::FROM_KEY, Vec::from_array(env, [old_admin.into_val(env)]));
        metadata.set(Self::TO_KEY, Vec::from_array(env, [new_admin.into_val(env)]));

        Self::emit_standard(env, topics::ADMIN_CHANGED, Some(old_admin), data, metadata);
        
        // Also emit legacy event for backward compatibility
        env.events().publish(
            (topics::ADMIN_CHANGED, old_admin),
            new_admin,
        );
    }

    /// Emit an authorization change event using standardized format
    pub fn authorization_changed(env: &Env, user: Address, authorized: bool) {
        let mut data = Vec::new(env);
        data.push_back(authorized.into_val(env));

        let mut metadata = Map::new(env);
        metadata.set(Self::TO_KEY, Vec::from_array(env, [user.into_val(env)]));

        Self::emit_standard(env, topics::AUTHORIZATION_CHANGED, Some(user), data, metadata);
        
        // Also emit legacy event for backward compatibility
        env.events().publish(
            (topics::AUTHORIZATION_CHANGED, user),
            authorized,
        );
    }

    /// Emit a pool updated event using standardized format
    pub fn pool_updated(env: &Env, admin: Address, reward_rate: i128, bonus_multiplier: u32) {
        let mut data = Vec::new(env);
        data.push_back(reward_rate.into_val(env));
        data.push_back(bonus_multiplier.into_val(env));

        let mut metadata = Map::new(env);
        metadata.set(Self::REWARD_RATE_KEY, Vec::from_array(env, [reward_rate.into_val(env)]));

        Self::emit_standard(env, topics::POOL_UPDATED, Some(admin), data, metadata);
        
        // Also emit legacy event for backward compatibility
        env.events().publish(
            (topics::POOL_UPDATED, admin),
            (reward_rate, bonus_multiplier, env.ledger().timestamp()),
        );
    }

    /// Emit a trade executed event using standardized format
    pub fn trade_executed(
        env: &Env,
        trader: Address,
        pair: Symbol,
        amount: i128,
        price: i128,
        is_buy: bool,
        fee_amount: i128,
        fee_token: Address,
    ) {
        let mut data = Vec::new(env);
        data.push_back(pair.into_val(env));
        data.push_back(amount.into_val(env));
        data.push_back(price.into_val(env));
        data.push_back(is_buy.into_val(env));
        data.push_back(fee_amount.into_val(env));
        data.push_back(fee_token.into_val(env));

        let mut metadata = Map::new(env);
        metadata.set(Self::PAIR_KEY, Vec::from_array(env, [pair.into_val(env)]));
        metadata.set(Self::AMOUNT_KEY, Vec::from_array(env, [amount.into_val(env)]));
        metadata.set(Self::PRICE_KEY, Vec::from_array(env, [price.into_val(env)]));
        metadata.set(Self::FEE_KEY, Vec::from_array(env, [fee_amount.into_val(env)]));
        metadata.set(Self::TOKEN_KEY, Vec::from_array(env, [fee_token.into_val(env)]));

        Self::emit_standard(env, topics::TRADE_EXECUTED, Some(trader), data, metadata);
        
        // Also emit legacy event for backward compatibility
        let event = TradeExecutedEvent {
            trade_id: 0, // This would be set by the calling contract
            trader: trader.clone(),
            pair,
            amount,
            price,
            is_buy,
            fee_amount,
            fee_token,
            timestamp: env.ledger().timestamp(),
        };
        Self::trade_executed_legacy(env, event);
    }

    /// Emit a fee collected event using standardized format
    pub fn fee_collected(env: &Env, payer: Address, recipient: Address, amount: i128, token: Address) {
        let mut data = Vec::new(env);
        data.push_back(amount.into_val(env));
        data.push_back(token.into_val(env));

        let mut metadata = Map::new(env);
        metadata.set(Self::FROM_KEY, Vec::from_array(env, [payer.into_val(env)]));
        metadata.set(Self::TO_KEY, Vec::from_array(env, [recipient.into_val(env)]));
        metadata.set(Self::AMOUNT_KEY, Vec::from_array(env, [amount.into_val(env)]));
        metadata.set(Self::TOKEN_KEY, Vec::from_array(env, [token.into_val(env)]));

        Self::emit_standard(env, topics::FEE_COLLECTED, Some(payer), data, metadata);
        
        // Also emit legacy event for backward compatibility
        let event = FeeCollectedEvent {
            payer: payer.clone(),
            recipient: recipient.clone(),
            amount,
            token,
            timestamp: env.ledger().timestamp(),
        };
        Self::fee_collected_legacy(env, event);
    }

    /// Emit a proposal created event using standardized format
    pub fn proposal_created(env: &Env, proposer: Address, proposal_id: u64, title: String, proposal_type: Symbol) {
        let mut data = Vec::new(env);
        data.push_back(proposal_id.into_val(env));
        data.push_back(Symbol::new(env, &title).into_val(env));
        data.push_back(proposal_type.into_val(env));

        let mut metadata = Map::new(env);
        metadata.set(Self::PROPOSAL_ID_KEY, Vec::from_array(env, [proposal_id.into_val(env)]));

        Self::emit_standard(env, topics::PROPOSAL_CREATED, Some(proposer), data, metadata);
        
        // Also emit legacy event for backward compatibility
        env.events().publish(
            (topics::PROPOSAL_CREATED, proposer),
            (proposal_id, title, proposal_type, env.ledger().timestamp()),
        );
    }

    /// Emit a proposal executed event using standardized format
    pub fn proposal_executed(env: &Env, executor: Address, proposal_id: u64, success: bool) {
        let mut data = Vec::new(env);
        data.push_back(proposal_id.into_val(env));
        data.push_back(success.into_val(env));

        let mut metadata = Map::new(env);
        metadata.set(Self::PROPOSAL_ID_KEY, Vec::from_array(env, [proposal_id.into_val(env)]));

        Self::emit_standard(env, topics::PROPOSAL_EXECUTED, Some(executor), data, metadata);
        
        // Also emit legacy event for backward compatibility
        env.events().publish(
            (topics::PROPOSAL_EXECUTED, executor),
            (proposal_id, success, env.ledger().timestamp()),
        );
    }

    // Legacy event emission methods for backward compatibility

    /// Emit a trade executed event (legacy)
    pub fn trade_executed_legacy(env: &Env, event: TradeExecutedEvent) {
        env.events().publish((topics::TRADE_EXECUTED,), event);
    }

    /// Emit a contract paused event (legacy)
    pub fn contract_paused(env: &Env, event: ContractPausedEvent) {
        env.events().publish((topics::CONTRACT_PAUSED,), event);
    }

    /// Emit a contract unpaused event (legacy)
    pub fn contract_unpaused(env: &Env, event: ContractUnpausedEvent) {
        env.events().publish((topics::CONTRACT_UNPAUSED,), event);
    }

    /// Emit a fee collected event (legacy)
    pub fn fee_collected_legacy(env: &Env, event: FeeCollectedEvent) {
        env.events().publish((topics::FEE_COLLECTED,), event);
    }

    /// Emit a proposal created event (legacy)
    pub fn proposal_created_legacy(env: &Env, event: ProposalCreatedEvent) {
        env.events().publish((topics::PROPOSAL_CREATED,), event);
    }

    /// Emit a proposal approved event (legacy)
    pub fn proposal_approved(env: &Env, event: ProposalApprovedEvent) {
        env.events().publish((topics::PROPOSAL_APPROVED,), event);
    }

    /// Emit a proposal rejected event (legacy)
    pub fn proposal_rejected(env: &Env, event: ProposalRejectedEvent) {
        env.events().publish((topics::PROPOSAL_REJECTED,), event);
    }

    /// Emit a proposal executed event (legacy)
    pub fn proposal_executed_legacy(env: &Env, event: ProposalExecutedEvent) {
        env.events().publish((topics::PROPOSAL_EXECUTED,), event);
    }

    /// Emit a proposal cancelled event (legacy)
    pub fn proposal_cancelled(env: &Env, event: ProposalCancelledEvent) {
        env.events().publish((topics::PROPOSAL_CANCELLED,), event);
    }

    /// Emit a reward added event (legacy)
    pub fn reward_added(env: &Env, event: RewardAddedEvent) {
        env.events().publish((topics::REWARD_ADDED,), event);
    }

    /// Emit a reward claimed event (legacy)
    pub fn reward_claimed_legacy(env: &Env, event: RewardClaimedEvent) {
        env.events().publish((topics::REWARD_CLAIMED,), event);
    }
}

// =============================================================================
// Event Schema Versioning
// =============================================================================

/// Event schema versioning utilities
pub struct EventSchema;

impl EventSchema {
    /// Get current schema version
    pub fn current_version() -> u32 {
        EventEmitter::CURRENT_VERSION
    }

    /// Validate event schema compatibility
    pub fn is_compatible(version: u32) -> bool {
        version <= Self::current_version()
    }

    /// Get migration path for event schema upgrades
    pub fn get_migration_path(from_version: u32, to_version: u32) -> Option<Vec<String>> {
        if from_version >= to_version {
            return None;
        }

        let mut steps = Vec::new();
        
        // Define migration steps for each version bump
        match (from_version, to_version) {
            (1, 2) => {
                steps.push("Add metadata fields for enhanced indexing".to_string());
                steps.push("Update event type symbols for consistency".to_string());
            }
            (1, 3) | (2, 3) => {
                steps.push("Add batch operation support".to_string());
                steps.push("Include gas usage metadata".to_string());
            }
            _ => {
                // For future versions, add generic migration step
                steps.push(format!("Migrate from v{} to v{}", from_version, to_version));
            }
        }

        Some(steps)
    }
}
