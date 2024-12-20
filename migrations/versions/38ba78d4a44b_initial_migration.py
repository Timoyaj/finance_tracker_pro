"""Initial migration

Revision ID: 38ba78d4a44b
Revises: 
Create Date: 2024-12-19 23:18:21.465475

"""
from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = '38ba78d4a44b'
down_revision = None
branch_labels = None
depends_on = None


def upgrade():
    # ### commands auto generated by Alembic - please adjust! ###
    op.create_table('users',
    sa.Column('id', sa.Integer(), nullable=False),
    sa.Column('username', sa.String(length=80), nullable=False),
    sa.Column('email', sa.String(length=120), nullable=False),
    sa.Column('password_hash', sa.String(length=128), nullable=True),
    sa.Column('reset_token', sa.String(length=100), nullable=True),
    sa.Column('reset_token_expiry', sa.DateTime(), nullable=True),
    sa.Column('created_at', sa.DateTime(), nullable=True),
    sa.PrimaryKeyConstraint('id'),
    sa.UniqueConstraint('email'),
    sa.UniqueConstraint('reset_token'),
    sa.UniqueConstraint('username')
    )
    op.create_table('transactions',
    sa.Column('id', sa.Integer(), nullable=False),
    sa.Column('date', sa.Date(), nullable=False),
    sa.Column('amount', sa.Float(), nullable=False),
    sa.Column('category', sa.String(length=50), nullable=False),
    sa.Column('description', sa.String(length=200), nullable=False),
    sa.Column('timestamp', sa.DateTime(), nullable=True),
    sa.Column('user_id', sa.Integer(), nullable=True),
    sa.ForeignKeyConstraint(['user_id'], ['users.id'], ),
    sa.PrimaryKeyConstraint('id')
    )
    # ### end Alembic commands ###


def downgrade():
    # ### commands auto generated by Alembic - please adjust! ###
    op.drop_table('transactions')
    op.drop_table('users')
    # ### end Alembic commands ###
