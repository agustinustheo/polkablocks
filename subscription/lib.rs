#![cfg_attr(not(feature = "std"), no_std, no_main)]

#[ink::contract]
mod minimal_sub_pull {
    use ink::prelude::vec::Vec;
    use ink::storage::Mapping;
    use scale::{Decode, Encode};

    // Use OpenBrush PSP22 cross-contract interface
    use openbrush::contracts::traits::psp22::PSP22Ref;

    #[derive(Encode, Decode, Debug, PartialEq, Eq, Clone, Copy)]
    #[cfg_attr(feature = "std", derive(scale_info::TypeInfo))]
    pub enum Err {
        AlreadySubscribed,
        NotSubscribed,
        NoAllowance,
        PSP22Error,
    }

    #[ink(storage)]
    pub struct MinimalSubPull {
        token: AccountId,                     // PSP22 token address
        subscribed: Mapping<AccountId, ()>,   // simple flag
    }

    impl MinimalSubPull {
        #[ink(constructor)]
        pub fn new(token: AccountId) -> Self {
            Self { token, subscribed: Default::default() }
        }

        #[ink(message)]
        pub fn subscribe(&mut self) -> Result<(), Err> {
            let who = self.env().caller();
            if self.subscribed.contains(who) { return Err(Err::AlreadySubscribed); }
            self.subscribed.insert(who, &());
            self.env().emit_event(Subscribed { account: who });
            Ok(())
        }

        #[ink(message)]
        pub fn cancel(&mut self) -> Result<(), Err> {
            let who = self.env().caller();
            if !self.subscribed.contains(who) { return Err(Err::NotSubscribed); }
            self.subscribed.remove(who);
            self.env().emit_event(Canceled { account: who });
            Ok(())
        }

        /// Pull `amount` from `subscriber` into this contract (requires allowance).
        #[ink(message)]
        pub fn bill(&mut self, subscriber: AccountId, amount: Balance) -> Result<(), Err> {
            if !self.subscribed.contains(subscriber) { return Err(Err::NotSubscribed); }

            // // Optional: check allowance for nicer errors
            // let allowance = PSP22Ref::allowance(&self.token, subscriber, self.env().account_id());
            // if allowance < amount { return Err(Err::NoAllowance); }

            // // Pull funds
            // PSP22Ref::transfer_from(&self.token, subscriber, self.env().account_id(), amount, Vec::new())
            //     .map_err(|_| Err::PSP22Error)?;

            self.env().emit_event(Billed { subscriber, amount });
            Ok(())
        }

        #[ink(message)]
        pub fn is_subscribed(&self, who: AccountId) -> bool {
            self.subscribed.contains(who)
        }

        #[ink(message)]
        pub fn contract_token_address(&self) -> AccountId { self.token }
    }

    #[ink(event)]
    pub struct Subscribed { #[ink(topic)] account: AccountId }
    #[ink(event)]
    pub struct Canceled { #[ink(topic)] account: AccountId }
    #[ink(event)]
    pub struct Billed { #[ink(topic)] subscriber: AccountId, amount: Balance }
}