import { Address, beginCell, Cell, Contract, contractAddress, ContractProvider, Dictionary, Sender, SendMode, toNano } from 'ton-core';

export type Task2Config = {
    admin: Address,
    shares: Map<Address, number>,
};

export function task2ConfigToCell(config: Task2Config): Cell {
    let dict = Dictionary.empty<Buffer, number>();
    for (let addr of config.shares.keys()) {
        dict.set(addr.hash, config.shares.get(addr)!);
    }
    return beginCell()
        .storeAddress(config.admin)
        .storeDict(dict, Dictionary.Keys.Buffer(32), Dictionary.Values.Uint(32))
        .endCell();
}

export class Task2 implements Contract {
    constructor(readonly address: Address, readonly init?: { code: Cell; data: Cell }) {}

    static createFromAddress(address: Address) {
        return new Task2(address);
    }

    static createFromConfig(config: Task2Config, code: Cell, workchain = 0) {
        const data = task2ConfigToCell(config);
        const init = { code, data };
        return new Task2(contractAddress(workchain, init), init);
    }

    async sendDeploy(provider: ContractProvider, via: Sender, value: bigint) {
        await provider.internal(via, {
            value,
            sendMode: SendMode.PAY_GAS_SEPARATELY,
            body: beginCell().storeUint(0, 32 + 64).endCell(),
        });
    }

    async sendAdd(provider: ContractProvider, via: Sender, addr: Address, share: number) {
        await provider.internal(via, {
            value: toNano('1'),
            sendMode: SendMode.PAY_GAS_SEPARATELY,
            body: beginCell().storeUint(0x368ddef3, 32).storeUint(0, 64).storeAddress(addr).storeUint(share, 32).endCell(),
        });
    }

    async sendRemove(provider: ContractProvider, via: Sender, addr: Address) {
        await provider.internal(via, {
            value: toNano('1'),
            sendMode: SendMode.PAY_GAS_SEPARATELY,
            body: beginCell().storeUint(0x278205c8, 32).storeUint(0, 64).storeAddress(addr).endCell(),
        });
    }

    async sendSplit(provider: ContractProvider, via: Sender, amount: bigint) {
        await provider.internal(via, {
            value: amount,
            sendMode: SendMode.PAY_GAS_SEPARATELY,
            body: beginCell().storeUint(0x68530b3, 32).storeUint(0, 64).endCell(),
        });
    }

    async sendJetton(provider: ContractProvider, via: Sender, amount: bigint) {
        await provider.internal(via, {
            value: toNano('1'),
            sendMode: SendMode.PAY_GAS_SEPARATELY,
            body: beginCell().storeUint(0x7362d09c, 32).storeUint(0, 64).storeCoins(amount).endCell(),
        });
    }

    async getShare(provider: ContractProvider, addr: Address): Promise<number> {
        const { stack } = await provider.get('get_user_share', [{ type: 'slice', cell: beginCell().storeAddress(addr).endCell() }]);
        return stack.readNumber();
    }

    async getUsers(provider: ContractProvider): Promise<Dictionary<Buffer, number>> {
        const { stack } = await provider.get('get_users', []);
        return Dictionary.loadDirect(Dictionary.Keys.Buffer(256), Dictionary.Values.Uint(32), stack.readCell().beginParse());
    }
}
