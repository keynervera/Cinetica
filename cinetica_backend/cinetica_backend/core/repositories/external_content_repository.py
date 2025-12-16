from core.mongo import get_mongo_db
from bson import ObjectId
from core.mongo import get_mongo_db
from bson import ObjectId

COLLECTION = "external_contents"

def save_external_content(data: dict):
    db = get_mongo_db()
    result = db[COLLECTION].insert_one(data)
    return str(result.inserted_id)

def list_external_contents():
    db = get_mongo_db()
    docs = list(db[COLLECTION].find())
    for d in docs:
        d["id"] = str(d["_id"])
        del d["_id"]
    return docs

def get_external_content(doc_id: str):
    db = get_mongo_db()
    doc = db[COLLECTION].find_one({"_id": ObjectId(doc_id)})
    if not doc:
        return None
    doc["id"] = str(doc["_id"])
    del doc["_id"]
    return doc

def update_external_content(doc_id: str, data: dict):
    db = get_mongo_db()
    result = db[COLLECTION].update_one({"_id": ObjectId(doc_id)}, {"$set": data})
    return result.matched_count > 0

def delete_external_content(doc_id: str):
    db = get_mongo_db()
    result = db[COLLECTION].delete_one({"_id": ObjectId(doc_id)})
    return result.deleted_count > 0
