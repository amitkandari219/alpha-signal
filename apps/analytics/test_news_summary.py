#!/usr/bin/env python3
"""
Quick test: Generate News Digest summary
"""
import sys
sys.path.insert(0, '/app')

from src.engines.llm_engine import LLMEngine
from sqlalchemy import create_engine, text
import os
import json

# Get Dixon company ID
db_url = os.getenv(
    'DATABASE_URL',
    'postgresql://alphasignal:alphasignal_dev_password@postgres:5432/alphasignal'
)
engine = create_engine(db_url)

with engine.connect() as conn:
    query = text("SELECT id, company_name FROM companies WHERE nse_symbol = 'DIXON'")
    result = conn.execute(query)
    company = dict(result.fetchone()._mapping)

company_id = str(company['id'])
company_name = company['company_name']

print(f"\n{'='*80}")
print(f"Generating News Digest for {company_name}")
print(f"{'='*80}\n")

# Initialize LLM engine
llm = LLMEngine()

# Build context
context = llm.news_digest_context(company_id)

print(f"📊 Context includes {len(context['news_last_7d'])} news articles from last 7 days\n")

# Get prompts
system_prompt, user_prompt_template = llm._get_prompt_template('news_digest')

# Format prompt
user_prompt = user_prompt_template.format(
    company_name=company_name,
    context_json=json.dumps(context, indent=2, default=str)
)

print(f"📝 Calling Claude API...\n")

# Call Claude
output, token_usage = llm._call_claude(system_prompt, user_prompt, max_tokens=2000)

print(f"✅ Summary Generated!\n")
print(f"{'='*80}")
print(f"NEWS DIGEST - {company_name}")
print(f"{'='*80}\n")

print("Summary:")
print(output.get('summary', 'N/A'))
print()

if 'key_events' in output:
    print("Key Events:")
    for i, event in enumerate(output['key_events'], 1):
        print(f"  {i}. {event}")
    print()

if 'sentiment_overview' in output:
    print(f"Sentiment Overview: {output['sentiment_overview']}")
    print()

if 'market_moving_news' in output:
    print("Market-Moving News:")
    for i, news in enumerate(output['market_moving_news'], 1):
        print(f"  {i}. {news}")
    print()

print(f"{'='*80}")
print(f"Token Usage: {token_usage['total_tokens']:,} tokens")
print(f"  Input: {token_usage['input_tokens']:,}")
print(f"  Output: {token_usage['output_tokens']:,}")
print(f"  Estimated cost: ${(token_usage['input_tokens']/1_000_000)*3 + (token_usage['output_tokens']/1_000_000)*15:.4f}")
print(f"{'='*80}\n")
