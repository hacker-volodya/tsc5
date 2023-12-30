import { Address, beginCell, Cell, Contract, contractAddress, ContractProvider, Sender, SendMode } from 'ton-core';

export type Task1Config = {
    publicKey: string,
    executionTime: number,
    receiver: Address,
    seqno: number,
};

export function task1ConfigToCell(config: Task1Config): Cell {
    return beginCell()
        .storeBuffer(Buffer.from(config.publicKey, 'hex'))
        .storeUint(config.executionTime, 32)
        .storeAddress(config.receiver)
        .storeUint(config.seqno, 32)
        .endCell();
}

export class Task1 implements Contract {
    constructor(readonly address: Address, readonly init?: { code: Cell; data: Cell }) {}

    static createFromAddress(address: Address) {
        return new Task1(address);
    }

    static createFromConfig(config: Task1Config, code: Cell, workchain = 0) {
        const data = task1ConfigToCell(config);
        const init = { code, data };
        return new Task1(contractAddress(workchain, init), init);
    }

    async sendDeploy(provider: ContractProvider, via: Sender, value: bigint) {
        await provider.internal(via, {
            value,
            sendMode: SendMode.PAY_GAS_SEPARATELY,
            body: beginCell().endCell(),
        });
    }

    async sendUpdate(provider: ContractProvider, signature: string, lockedFor: number, newSeqno: number) {
        await provider.external(beginCell().storeUint(0x9df10277, 32).storeUint(0, 64).storeBuffer(Buffer.from(signature, 'hex')).storeRef(beginCell().storeUint(lockedFor, 32).storeUint(newSeqno, 32).endCell()).endCell())
    }

    async sendClaim(provider: ContractProvider) {
        await provider.external(beginCell().storeUint(0xbb4be234, 32).storeUint(0, 64).endCell())
    }
}
