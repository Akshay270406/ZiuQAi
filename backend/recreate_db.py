import asyncio
from sqlalchemy import text
from app.db.base import Base, engine
from app.models import users, quizes, questions, participants, user_responses

async def recreate_db():
    async with engine.begin() as conn:
        print("Dropping schema public cascade...")
        await conn.execute(text("DROP SCHEMA public CASCADE;"))
        await conn.execute(text("CREATE SCHEMA public;"))
        print("Creating all tables...")
        await conn.run_sync(Base.metadata.create_all)
    print("Database recreated successfully.")

if __name__ == "__main__":
    asyncio.run(recreate_db())
