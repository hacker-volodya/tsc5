import { Blockchain, SandboxContract, TreasuryContract } from '@ton-community/sandbox';
import { Address, Cell, toNano } from 'ton-core';
import { Task2 } from '../wrappers/Task2';
import '@ton-community/test-utils';
import { compile } from '@ton-community/blueprint';

describe('Task2', () => {
    let code: Cell;

    beforeAll(async () => {
        code = await compile('Task2');
    });

    let blockchain: Blockchain;
    let task2: SandboxContract<Task2>;
    let deployer: SandboxContract<TreasuryContract>;

    beforeEach(async () => {
        blockchain = await Blockchain.create();

        blockchain.verbosity = {
            blockchainLogs: false,
            vmLogs: 'vm_logs_full',
            debugLogs: false,
            print: false
        }

        deployer = await blockchain.treasury('deployer');
        task2 = blockchain.openContract(Task2.createFromConfig({
            admin: deployer.address,
            shares: new Map<Address, number>([
                [Address.parseRaw("0:0000000000000000000000000000000000000000000000000000000000000000"), 3],
                [Address.parseRaw("0:0000000000000000000000000000000000000000000000000000000000000001"), 1],
            ])
        }, code));
        const deployResult = await task2.sendDeploy(deployer.getSender(), toNano('0.05'));

        expect(deployResult.transactions).toHaveTransaction({
            from: deployer.address,
            to: task2.address,
            deploy: true,
            success: true,
        });
    });

    it('should get share', async () => {
        expect(await task2.getShare(Address.parseRaw("0:0000000000000000000000000000000000000000000000000000000000000000"))).toBe(3)
    });

    it('should get users', async () => {
        await task2.getUsers();
    });

    it('should add successfully', async () => {
        const result = await task2.sendAdd(deployer.getSender(), Address.parseRaw("0:0000000000000000000000000000000000000000000000000000000000000002"), 10);
        const share = await task2.getShare(Address.parseRaw("0:0000000000000000000000000000000000000000000000000000000000000002"));

        expect(result.transactions).toHaveTransaction({
            from: deployer.address,
            to: task2.address,
            success: true,
        });

        expect(share).toBe(10);
    });

    it('should remove successfully', async () => {
        const users1 = await task2.getUsers();
        expect(users1.get(Buffer.from('0000000000000000000000000000000000000000000000000000000000000001', 'hex'))).toBe(1);

        const result = await task2.sendRemove(deployer.getSender(), Address.parseRaw("0:0000000000000000000000000000000000000000000000000000000000000001"));
        const users2 = await task2.getUsers();

        expect(result.transactions).toHaveTransaction({
            from: deployer.address,
            to: task2.address,
            success: true,
        });

        expect(users2.get(Buffer.from('0000000000000000000000000000000000000000000000000000000000000001', 'hex'))).toBeUndefined();
    });

    it('should split successfully', async () => {
        const result = await task2.sendSplit(deployer.getSender(), toNano('10'));

        expect(result.transactions).toHaveTransaction({
            from: deployer.address,
            to: task2.address,
            success: true,
        });
    });

    it('should split jetton successfully', async () => {
        const result = await task2.sendJetton(deployer.getSender(), toNano('10'));

        expect(result.transactions).toHaveTransaction({
            from: deployer.address,
            to: task2.address,
            success: true,
        });
    });
});
