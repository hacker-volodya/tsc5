import { Blockchain, SandboxContract } from '@ton-community/sandbox';
import { Address, Cell, toNano } from 'ton-core';
import { Task1 } from '../wrappers/Task1';
import '@ton-community/test-utils';
import { compile } from '@ton-community/blueprint';

describe('Task1', () => {
    let code: Cell;

    beforeAll(async () => {
        code = await compile('Task1');
    });

    let blockchain: Blockchain;
    let task1: SandboxContract<Task1>;

    beforeEach(async () => {
        blockchain = await Blockchain.create();

        task1 = blockchain.openContract(Task1.createFromConfig({
            publicKey: '06aa52e6f0324fa8fb7e5a2a41153264aea2901de57a2c3d72e151e0f74ef01f',
            executionTime: 123,
            receiver: Address.parseFriendly("EQC38-cbo1HivDOdH0oOzyZfTKVpSkatn1ydXJYsrg5KvLNI").address,
            seqno: 0
        }, code));

        const deployer = await blockchain.treasury('deployer');

        const deployResult = await task1.sendDeploy(deployer.getSender(), toNano('0.05'));

        expect(deployResult.transactions).toHaveTransaction({
            from: deployer.address,
            to: task1.address,
            deploy: true,
            success: true,
        });
    });

    it('should deploy', async () => {
        // the check is done inside beforeEach
        // blockchain and task1 are ready to use
    });

    it('should claim', async () => {
        const res = await task1.sendClaim();
        
        expect(res.transactions).toHaveTransaction({
            from: task1.address,
            to: Address.parseFriendly("EQC38-cbo1HivDOdH0oOzyZfTKVpSkatn1ydXJYsrg5KvLNI").address
        })
    });
});
