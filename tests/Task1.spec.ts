import { Blockchain, SandboxContract } from '@ton-community/sandbox';
import { Address, Cell, toNano } from 'ton-core';
import { Task1 } from '../wrappers/Task1';
import '@ton-community/test-utils';
import { compile } from '@ton-community/blueprint';
import { KeyPair, keyPairFromSecretKey, keyPairFromSeed } from 'ton-crypto';

describe('Task1', () => {
    let code: Cell;

    beforeAll(async () => {
        code = await compile('Task1');
    });

    let blockchain: Blockchain;
    let task1: SandboxContract<Task1>;
    let task1Claimable: SandboxContract<Task1>;

    let keyPair = keyPairFromSeed(Buffer.from("0011223344556677889900112233445566778899001122334455667788990011", "hex"));

    beforeEach(async () => {
        blockchain = await Blockchain.create();

        blockchain.verbosity = {
            blockchainLogs: false,
            vmLogs: 'vm_logs_full',
            debugLogs: false,
            print: false
        }

        task1 = blockchain.openContract(Task1.createFromConfig({
            publicKey: keyPair.publicKey.toString('hex'),
            executionTime: 3000000000,
            receiver: Address.parseFriendly("EQC38-cbo1HivDOdH0oOzyZfTKVpSkatn1ydXJYsrg5KvLNI").address,
            seqno: 0
        }, code));

        task1Claimable = blockchain.openContract(Task1.createFromConfig({
            publicKey: keyPair.publicKey.toString('hex'),
            executionTime: 1,
            receiver: Address.parseFriendly("EQC38-cbo1HivDOdH0oOzyZfTKVpSkatn1ydXJYsrg5KvLNI").address,
            seqno: 0
        }, code));

        const deployer = await blockchain.treasury('deployer');

        const deployResult = await task1.sendDeploy(deployer.getSender(), toNano('0.05'));
        const deployResult2 = await task1Claimable.sendDeploy(deployer.getSender(), toNano('0.05'));

        expect(deployResult.transactions).toHaveTransaction({
            from: deployer.address,
            to: task1.address,
            deploy: true,
            success: true,
        });

        expect(deployResult2.transactions).toHaveTransaction({
            from: deployer.address,
            to: task1Claimable.address,
            deploy: true,
            success: true,
        });
    });

    it('should deploy', async () => {
        // the check is done inside beforeEach
        // blockchain and task1 are ready to use
    });

    it('should claim', async () => {
        const res = await task1Claimable.sendClaim();
        
        expect(res.transactions).toHaveTransaction({
            from: task1Claimable.address,
            to: Address.parseFriendly("EQC38-cbo1HivDOdH0oOzyZfTKVpSkatn1ydXJYsrg5KvLNI").address
        })
    });

    it('should update', async () => {
        const res = await task1.sendUpdate(keyPair, 2000000000, 1);
        
        expect(res.transactions).toHaveTransaction({
            success: true
        })
    })
});
