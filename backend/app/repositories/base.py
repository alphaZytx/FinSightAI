from app.db.mongo import db


class BaseRepository:
    collection_name: str

    @property
    def collection(self):
        return db[self.collection_name]
