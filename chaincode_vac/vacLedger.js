'use strict';

const { Contract } = require('fabric-contract-api');

class VACLedger extends Contract {

    async initLedger(ctx) {
        console.log('Khởi tạo Sổ cái V.A.C Farm thành công!');
    }

    async addLog(ctx, cropName, actionType, detail, author) {
        const timestamp = new Date().toISOString();
        const txId = ctx.stub.getTxID(); 

        const log = {
            cropName: cropName.toLowerCase(),
            actionType: actionType,
            detail: detail,
            author: author,
            timestamp: timestamp,
            txId: txId
        };

        await ctx.stub.putState(txId, Buffer.from(JSON.stringify(log)));
        return JSON.stringify(log);
    }

    async getLogsByCrop(ctx, cropName) {
        const iterator = await ctx.stub.getStateByRange('', '');
        const allResults = [];
        
        let result = await iterator.next();
        while (!result.done) {
            const strValue = Buffer.from(result.value.value.toString('utf8')).toString('utf8');
            let record;
            try {
                record = JSON.parse(strValue);
                if (record.cropName.includes(cropName.toLowerCase())) {
                    allResults.push(record);
                }
            } catch (err) {
                console.log(err);
            }
            result = await iterator.next();
        }
        
        allResults.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
        return JSON.stringify(allResults);
    }
}

module.exports = VACLedger;