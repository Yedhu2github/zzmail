import { MongoClient } from 'mongodb';
const mongoUrl = process.env.MONGO_URL || 'mongodb://127.0.0.1:27017'
const dbName = process.env.MONGO_DB || 'cog25'
const collName = process.env.MONGO_COLLECTION || 'mails'

let _client = null
let _collectionPromise = null

async function getCollection() {
    if (_collectionPromise) return _collectionPromise
    _collectionPromise = (async () => {
        _client = _client || await MongoClient.connect(mongoUrl, { useNewUrlParser: true, useUnifiedTopology: true })
        const db = _client.db(dbName)
        const col = db.collection(collName)
        // ensure unique index on `id`
        await col.createIndex({ id: 1 }, { unique: true }).catch(() => {})
        return col
    })()
    return _collectionPromise
}

export const checkIfAlreadyDone = async (id) => {
    if (!id) return false
    const col = await getCollection()
    const doc = await col.findOne({ id: String(id) })
    return !!doc
}

export const insertMailToDB = async (mail) => {
    if (!mail || !mail.id) throw new Error('mail must be an object with a unique "id" string')
    const col = await getCollection()
    try {
        await col.insertOne({ ...mail, id: String(mail.id) })
        return await col.findOne({ id: String(mail.id) })
    } catch (err) {
        // duplicate key -> return existing document
        if (err && err.code === 11000) {
            return await col.findOne({ id: String(mail.id) })
        }
        throw err
    }
}

export const getAllMails = async () => {
    const col = await getCollection()
    return await col.find({}).toArray()
}

export const getMailById = async (id) => {
    if (!id) return null
    const col = await getCollection()
    return await col.findOne({ id: String(id) })
}

export const getMailByType = async (type) => {
    // the mail should be returned on the basis of type
    // type is a string that can be: "Urgent", "Time sensitive", "Informational"
    if (!type || typeof type !== 'string') return []
    const allowed = new Set(['Urgent', 'Time sensitive', 'Informational'])
    if (!allowed.has(type)) return []
    const col = await getCollection()
    // find documents where the "type" field equals the requested type
    return await col.find({ type: type }).toArray()
}
