import decimal from 'decimal.js'

const deriveExchanges = (tx) => {
    let hash = tx.hash || tx.transaction.hash
    let taker = tx.Account || tx.transaction.Account
    let exchanges = []


    for(let affected of (tx.meta || tx.metaData).AffectedNodes){
        let node = affected.ModifiedNode || affected.DeletedNode

        if(!node || node.LedgerEntryType !== 'Offer')
            continue

        if(!node.PreviousFields || !node.PreviousFields.TakerPays || !node.PreviousFields.TakerGets)
            continue

        let maker = node.FinalFields.Account
        let sequence = node.FinalFields.Sequence
        let previousTakerPays = fromLedgerAmount(node.PreviousFields.TakerPays)
        let previousTakerGets = fromLedgerAmount(node.PreviousFields.TakerGets)
        let finalTakerPays = fromLedgerAmount(node.FinalFields.TakerPays)
        let finalTakerGets = fromLedgerAmount(node.FinalFields.TakerGets)

        let takerPaid = {
            ...finalTakerPays, 
            value: previousTakerPays.value.minus(finalTakerPays.value)
        }

        let takerGot = {
            ...finalTakerGets, 
            value: previousTakerGets.value.minus(finalTakerGets.value)
        }

        const trade ={
            hash,
            maker,
            taker,
            sequence,
            base: {
                currency: currencyHexToUTF8(takerPaid.currency), 
                issuer: takerPaid.issuer
            },
            quote: {
                currency: currencyHexToUTF8(takerGot.currency), 
                issuer: takerGot.issuer
            },
            price: takerGot.value.div(takerPaid.value),
            volume: takerPaid.value
        }
        exchanges.push(trade)
    }

    return exchanges
}


const fromLedgerAmount = (amount) => {
    if (typeof amount === 'string') {
        return {
            currency: 'XRP',
            value: decimal.div(amount, '1000000')
        }
    }
        
    return {
        currency: amount.currency,
        issuer: amount.issuer,
        value: new decimal(amount.value)
    }
}


const currencyHexToUTF8 = (code) => {
    if (code.length === 3)
        return code
    let decoded = new TextDecoder()
        .decode(hexToBytes(code))
    let padNull = decoded.length
    while (decoded.charAt(padNull - 1) === '\0')
        padNull--
    return decoded.slice(0, padNull)
}

const hexToBytes = (hex) => {
    let bytes = new Uint8Array(hex.length / 2)
    for (let i = 0; i !== bytes.length; i++) {
        bytes[i] = parseInt(hex.substr(i * 2, 2), 16)
    }
    return bytes
}

const LogTrade = (ledger_result, exchange, tx, account, last, name, fxrate) => {
    let data = null
    if (tx.Account == exchange.maker) {
        if (exchange.quote.currency == account.quote.currency  
            && exchange.quote.issuer == account.quote.issuer
            && exchange.base.currency == account.base.currency
            && exchange.base.issuer == account.base.issuer) {
                
                data = {
                    hash: exchange.hash,
                    quote: exchange.base.currency,
                    base: exchange.quote.currency,
                    amount: exchange.volume.toFixed() * exchange.price.toFixed(),
                    limit_price: 1 / exchange.price.toFixed(),
                    limit_price_converted: 1 / (exchange.price.toFixed() / (1/fxrate)),
                    timestamp: new Date((ledger_result.ledger.close_time + 946684800) *  1000).toString().split(' ')[4],
                    exchange: name,
                    side: 'buy',
                    color: (exchange.volume.toFixed() * exchange.price.toFixed() > last.limit_price) ? 'buy' : 'sell'
                }
                // console.log('a', data)
        }
    
        if (exchange.base.currency == account.quote.currency 
            && exchange.base.issuer == account.quote.issuer
            && exchange.quote.currency == account.base.currency
            && exchange.quote.issuer == account.base.issuer) {
                data = {
                    hash: exchange.hash,
                    quote: exchange.quote.currency,
                    base: exchange.base.currency,
                    amount: exchange.volume.toFixed() *1,
                    limit_price: exchange.price.toFixed() *1,
                    limit_price_converted: exchange.price.toFixed() / fxrate,
                    timestamp: new Date((ledger_result.ledger.close_time + 946684800) *  1000).toString().split(' ')[4],
                    exchange: name,
                    side: 'sell',
                    color: ((exchange.price.toFixed() *1) > last.limit_price) ? 'buy' : 'sell'
                }
                // console.log('b', data)
        }
    }
    if (tx.Account == exchange.taker) {
        if (exchange.quote.currency == account.quote.currency  
            && exchange.quote.issuer == account.quote.issuer
            && exchange.base.currency == account.base.currency
            && exchange.base.issuer == account.base.issuer) {
                data = {
                    hash: exchange.hash,
                    quote: exchange.quote.currency,
                    base: exchange.base.currency,
                    amount: exchange.volume.toFixed() *1,
                    limit_price: exchange.price.toFixed() *1,
                    limit_price_converted: exchange.price.toFixed() / fxrate,
                    timestamp: new Date((ledger_result.ledger.close_time + 946684800) *  1000).toString().split(' ')[4],
                    exchange: name,
                    side: 'sell',
                    color: ((exchange.price.toFixed() *1) > last.limit_price) ? 'buy' : 'sell'
                }
                // console.log('c', data)
                
        }
    
        if (exchange.base.currency == account.quote.currency 
            && exchange.base.issuer == account.quote.issuer
            && exchange.quote.currency == account.base.currency
            && exchange.quote.issuer == account.base.issuer) {
                data = {
                    hash: exchange.hash,
                    quote: exchange.base.currency,
                    base: exchange.quote.currency,
                    amount: exchange.volume.toFixed() * exchange.price.toFixed(),
                    limit_price: 1 / exchange.price.toFixed(),
                    limit_price_converted: 1 / (exchange.price.toFixed() / (1/fxrate)),
                    timestamp: new Date((ledger_result.ledger.close_time + 946684800) *  1000).toString().split(' ')[4],
                    exchange: name,
                    side: 'buy',
                    color: (exchange.volume.toFixed() * exchange.price.toFixed() > last.limit_price) ? 'buy' : 'sell'
                }
                // console.log('d', data)
        }
    }
    return data
}

export {
    hexToBytes,
    currencyHexToUTF8,
    fromLedgerAmount,
    deriveExchanges,
    LogTrade
}