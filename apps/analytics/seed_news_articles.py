#!/usr/bin/env python3
"""
Seed news articles for NLP Pipeline testing

Creates 30 sample news articles:
- 6 articles per seed company
- 2 positive, 2 negative, 2 neutral per company
- Realistic Indian market language
"""
import sys
sys.path.insert(0, '/app')

from sqlalchemy import create_engine, text
from datetime import datetime, timedelta
import os
import logging

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


def seed_articles():
    """Seed news articles for testing"""
    db_url = os.getenv(
        'DATABASE_URL',
        'postgresql://alphasignal:alphasignal_dev_password@postgres:5432/alphasignal'
    )
    engine = create_engine(db_url)

    # Get company IDs
    with engine.connect() as conn:
        query = text("""
            SELECT id, company_name, nse_symbol
            FROM companies
            WHERE nse_symbol IN ('DIXON', 'DEEPAKNTR', 'POLYCAB', 'CLEAN', 'ASTRAL')
            ORDER BY nse_symbol
        """)
        result = conn.execute(query)
        companies = {row.nse_symbol: dict(row._mapping) for row in result}

    if len(companies) != 5:
        logger.error(f"Expected 5 companies, found {len(companies)}")
        return

    # Sample articles for each company
    articles_data = {
        'DIXON': [
            # Positive 1
            {
                'title': 'Dixon Technologies reports record Q3 revenue growth of 35% YoY',
                'content': '''Dixon Technologies has announced stellar Q3 FY24 results with revenue growth of 35% year-on-year, driven by strong demand across all product segments. The company's mobile phone manufacturing division saw exceptional performance with increased orders from multiple brands. Management highlighted improved operating margins due to better product mix and operational efficiencies. The company expects continued momentum in Q4 as it ramps up production capacity at its new Noida facility. Analysts remain bullish on Dixon's growth prospects in the electronics manufacturing services sector.''',
                'source': 'Economic Times',
                'sentiment': 'POSITIVE'
            },
            # Positive 2
            {
                'title': 'Dixon Technologies wins major contract from leading smartphone brand',
                'content': '''Dixon Technologies Limited has secured a significant manufacturing contract from a leading global smartphone brand, marking a major milestone in its growth journey. The deal is expected to add approximately ₹2,000 crore to annual revenues over the next two years. The company will manufacture premium smartphone models at its state-of-the-art facility in Noida. This win strengthens Dixon's position as India's largest electronics manufacturing services provider. Brokerages have upgraded their earnings estimates and raised target prices following this announcement.''',
                'source': 'Business Standard',
                'sentiment': 'POSITIVE'
            },
            # Negative 1
            {
                'title': 'Dixon Technologies faces margin pressure from rising component costs',
                'content': '''Dixon Technologies reported lower-than-expected margins in Q3 due to rising component costs and supply chain disruptions. The company's gross margins declined by 150 basis points sequentially as input costs for semiconductors and display panels increased sharply. Management acknowledged near-term headwinds but expressed confidence in passing through costs to customers in coming quarters. Some analysts have reduced their earnings estimates citing persistent inflation in raw material prices. The stock fell 6% in trading following the results announcement.''',
                'source': 'Moneycontrol',
                'sentiment': 'NEGATIVE'
            },
            # Negative 2
            {
                'title': 'Dixon Technologies CFO resigns citing personal reasons',
                'content': '''Dixon Technologies announced the resignation of its Chief Financial Officer (CFO) Mr. Saurabh Gupta, effective March 31, 2024. The company cited personal reasons for the resignation and stated that a search for a replacement is underway. This marks the second senior management exit in six months after the Head of Operations left the company in September 2023. Market participants expressed concerns about management stability during a crucial growth phase. The company assured investors of smooth transition and continuity in financial operations.''',
                'source': 'Business Line',
                'sentiment': 'NEGATIVE'
            },
            # Neutral 1
            {
                'title': 'Dixon Technologies announces board meeting on February 15 to consider Q3 results',
                'content': '''Dixon Technologies Limited has informed exchanges that a meeting of the Board of Directors will be held on Thursday, February 15, 2024, to consider and approve the unaudited financial results for the quarter ended December 31, 2023. The board will also review operational performance and business outlook. The company has set February 9, 2024, as the record date for determining entitlement of interim dividend, if any. Trading window for designated persons will remain closed from February 1 to February 17, 2024.''',
                'source': 'BSE Announcement',
                'sentiment': 'NEUTRAL'
            },
            # Neutral 2
            {
                'title': 'Dixon Technologies participates in Electronics Manufacturing Summit 2024',
                'content': '''Dixon Technologies was represented at the Electronics Manufacturing Summit 2024 held in New Delhi yesterday. The company's COO delivered a presentation on India's growing capabilities in electronics manufacturing and the PLI scheme's impact on the industry. The summit brought together industry leaders, policymakers, and technology providers to discuss the future of electronics manufacturing in India. Dixon showcased its manufacturing facilities and capabilities at the event. The company also participated in panel discussions on supply chain localization.''',
                'source': 'Press Release',
                'sentiment': 'NEUTRAL'
            }
        ],
        'DEEPAKNTR': [
            # Positive 1
            {
                'title': 'Deepak Nitrite expands capacity with ₹800 crore capex in specialty chemicals',
                'content': '''Deepak Nitrite announced a major capacity expansion plan with capital expenditure of ₹800 crore over the next 18 months. The company will add new manufacturing lines for advanced intermediates and specialty chemicals at its Nandesari facility in Gujarat. This expansion aligns with India's push for self-reliance in chemicals and pharmaceuticals. Management expects the new capacity to become operational by Q2 FY26 and contribute significantly to revenues. The announcement was well-received by markets with the stock gaining 8% in early trade.''',
                'source': 'Economic Times',
                'sentiment': 'POSITIVE'
            },
            # Positive 2
            {
                'title': 'Deepak Nitrite reports strong Q3 with EBITDA margins at 22%',
                'content': '''Deepak Nitrite Limited reported robust Q3 FY24 results with EBITDA margins at a healthy 22%, beating street estimates. Revenue grew 18% YoY driven by strong volume growth in phenolics and specialty chemicals segments. The company's backward integration strategy continues to yield benefits with improved cost competitiveness. Management highlighted strong order book visibility for the next two quarters and expressed confidence in sustaining margin performance. Brokerages maintain 'Buy' rating citing strong fundamentals and growth visibility.''',
                'source': 'CNBC-TV18',
                'sentiment': 'POSITIVE'
            },
            # Negative 1
            {
                'title': 'Deepak Nitrite faces margin pressure from rising crude oil prices',
                'content': '''Deepak Nitrite's management flagged concerns over rising crude oil prices impacting raw material costs in its earnings call. The company's key inputs including benzene and phenol have seen 15-20% price increases in recent weeks due to geopolitical tensions. While the company has some pass-through mechanisms in customer contracts, there could be a lag of one quarter affecting near-term margins. Analysts have trimmed Q4 margin estimates by 100-150 basis points citing unfavorable crude trajectory. The stock declined 5% following the management commentary.''',
                'source': 'Moneycontrol',
                'sentiment': 'NEGATIVE'
            },
            # Negative 2
            {
                'title': 'Deepak Nitrite plant shutdown for maintenance impacts Q4 production',
                'content': '''Deepak Nitrite announced a planned maintenance shutdown of its phenolics manufacturing unit at Nandesari for 18 days in March 2024. The company stated this is routine preventive maintenance but acknowledged it will impact Q4 production volumes. Management expects production loss of approximately ₹120-150 crore during the shutdown period. Some market participants expressed disappointment over the timing as demand conditions remain favorable. The company assured that long-term customer commitments will not be affected as adequate inventory has been built up.''',
                'source': 'Business Standard',
                'sentiment': 'NEGATIVE'
            },
            # Neutral 1
            {
                'title': 'Deepak Nitrite Ltd schedules analyst meet on February 20',
                'content': '''Deepak Nitrite Limited has scheduled an analyst and investor meeting on Tuesday, February 20, 2024, at its corporate office in Pune. The management will present the company's quarterly performance, business outlook, and strategic initiatives. The meeting will be attended by Managing Director Mr. Deepak Mehta and CFO Mr. Sanjay Upadhyay. A copy of the presentation will be made available on the company's website and stock exchange portals. Investors can participate through video conference using the link provided in the intimation.''',
                'source': 'NSE Announcement',
                'sentiment': 'NEUTRAL'
            },
            # Neutral 2
            {
                'title': 'Deepak Nitrite announces change in registered office address',
                'content': '''Deepak Nitrite Limited informed stock exchanges that it has changed its registered office address within Pune city effective February 1, 2024. The new address is at Enpee House, Plot No. 203, Viman Nagar, Pune - 411014. This is a routine administrative change and does not impact the company's operations or business activities. All correspondence should be sent to the new registered office address. The company has updated its website and other official documents with the new address details.''',
                'source': 'Company Filing',
                'sentiment': 'NEUTRAL'
            }
        ],
        'POLYCAB': [
            # Positive 1
            {
                'title': 'Polycab India reports exceptional Q3 with 28% revenue growth',
                'content': '''Polycab India delivered exceptional Q3 FY24 performance with consolidated revenue growing 28% YoY to ₹4,250 crore. The cables and wires segment saw strong volume growth of 22% driven by infrastructure spending and real estate recovery. FMEG (Fast Moving Electrical Goods) business continued its strong momentum with 40% growth. The company's operating margins expanded by 80 basis points to 13.2% due to favorable commodity prices and better product mix. Management expressed confidence in achieving FY24 guidance of 20-22% revenue growth.''',
                'source': 'Economic Times',
                'sentiment': 'POSITIVE'
            },
            # Positive 2
            {
                'title': 'Polycab India receives order worth ₹450 crore from major infrastructure project',
                'content': '''Polycab India has secured a significant order worth ₹450 crore from a major metro rail project in North India. The order involves supply of specialized cables and wiring solutions for the metro rail network spanning 35 kilometers. This marks one of the largest single orders received by the company in the infrastructure segment. Management highlighted strong order pipeline from government infrastructure projects including railways, metro, and smart cities. The order is expected to be executed over 18 months contributing to steady revenue visibility.''',
                'source': 'Business Line',
                'sentiment': 'POSITIVE'
            },
            # Negative 1
            {
                'title': 'Polycab India under SEBI scrutiny for related party transaction disclosures',
                'content': '''Polycab India Limited has received queries from SEBI regarding certain related party transactions disclosed in its annual report. The regulator has sought additional details and clarifications on transactions with entities linked to promoter group members. While the company maintains all transactions were at arm's length and properly disclosed, the regulatory scrutiny has raised concerns among investors. The stock fell 7% on heavy volumes following news of the SEBI inquiry. Legal experts suggest the matter may take several months to resolve through proper channels.''',
                'source': 'Moneycontrol',
                'sentiment': 'NEGATIVE'
            },
            # Negative 2
            {
                'title': 'Polycab India faces working capital pressure as copper prices surge',
                'content': '''Polycab India's management acknowledged working capital pressures in the recent earnings call as copper prices surged to multi-year highs. The company's working capital cycle increased to 75 days from 65 days in the previous quarter due to higher inventory costs. Copper represents nearly 50% of the company's raw material costs, and the recent 12% price increase has strained cash flows. While the company has hedging mechanisms in place, significant price volatility creates execution challenges. CFO indicated the company may need to draw on credit facilities to manage near-term working capital requirements.''',
                'source': 'Bloomberg Quint',
                'sentiment': 'NEGATIVE'
            },
            # Neutral 1
            {
                'title': 'Polycab India board meeting scheduled on February 10 for quarterly results',
                'content': '''Polycab India Limited has intimated stock exchanges that a meeting of the Board of Directors will be held on Saturday, February 10, 2024, to consider and approve the unaudited financial results for the third quarter ended December 31, 2023. The board will also review the company's operational performance across cable, wire, and FMEG segments. Trading window for designated persons and their immediate relatives has been closed from January 1, 2024, and will reopen 48 hours after the results announcement.''',
                'source': 'BSE Filing',
                'sentiment': 'NEUTRAL'
            },
            # Neutral 2
            {
                'title': 'Polycab India inaugurates new distribution center in Bangalore',
                'content': '''Polycab India Limited inaugurated a new distribution center in Bangalore yesterday to strengthen its presence in South India. The 50,000 sq ft facility will cater to the growing demand for cables, wires, and FMEG products in Karnataka and neighboring states. The distribution center is strategically located near the Bangalore-Hyderabad highway for efficient logistics. Company officials stated this is part of their ongoing strategy to expand distribution network and improve customer service levels. The facility is expected to serve over 500 dealers and distributors in the region.''',
                'source': 'Press Release',
                'sentiment': 'NEUTRAL'
            }
        ],
        'CLEAN': [
            # Positive 1
            {
                'title': 'Clean Science wins large export order worth ₹320 crore from European client',
                'content': '''Clean Science and Technology Limited has secured a major export order worth ₹320 crore from a leading European specialty chemicals company. The order is for supply of performance chemicals and functional additives over a period of 24 months. This marks Clean Science's largest international order and validates the company's product quality and competitive positioning in global markets. Management expressed confidence in expanding European market share as customers seek China+1 sourcing strategies. The news sent the stock up 9% as investors cheered the export breakthrough.''',
                'source': 'Economic Times',
                'sentiment': 'POSITIVE'
            },
            # Positive 2
            {
                'title': 'Clean Science achieves carbon neutrality at Parwanoo plant',
                'content': '''Clean Science and Technology announced that its manufacturing facility at Parwanoo, Himachal Pradesh, has achieved carbon neutrality through a combination of renewable energy adoption and carbon offset programs. The plant now runs on 100% renewable energy with solar panels and wind power procurement. This achievement positions Clean Science as an ESG leader in the Indian specialty chemicals sector. The company plans to extend carbon neutrality to all its facilities by FY26. Several international clients have acknowledged the company's sustainability leadership, potentially opening doors to premium contracts.''',
                'source': 'Business Standard',
                'sentiment': 'POSITIVE'
            },
            # Negative 1
            {
                'title': 'Clean Science faces FDA observations at Kurkumbh facility',
                'content': '''Clean Science and Technology received six observations from US FDA following an inspection at its Kurkumbh manufacturing facility in Maharashtra. While none of the observations were classified as critical, the company will need to submit a corrective action plan within 15 days. The observations primarily relate to documentation and validation procedures. Market participants expressed concern as Clean Science has been targeting US pharma customers for growth. The company stated it is confident of resolving all observations promptly and does not expect material business impact.''',
                'source': 'Moneycontrol',
                'sentiment': 'NEGATIVE'
            },
            # Negative 2
            {
                'title': 'Clean Science margins contract as input costs rise sharply',
                'content': '''Clean Science and Technology reported margin contraction of 280 basis points in Q3 FY24 due to sharp increase in input costs. The company's EBITDA margin fell to 32.5% from 35.3% in the year-ago quarter as prices of key raw materials including methanol and ethanol increased significantly. Management cited global supply constraints and crude oil price volatility as key drivers. While Clean Science has best-in-class margins in the sector, analysts expressed concern over sustainability if input cost pressures persist. The company is exploring backward integration options to mitigate raw material dependency.''',
                'source': 'CNBC-TV18',
                'sentiment': 'NEGATIVE'
            },
            # Neutral 1
            {
                'title': 'Clean Science Ltd announces board meeting on February 12 to consider Q3 results',
                'content': '''Clean Science and Technology Limited has informed stock exchanges that a Board meeting is scheduled on Monday, February 12, 2024, to consider and approve the financial results for the quarter ended December 31, 2023. The Board will also review operational performance across the company's product portfolio including performance chemicals, pharmaceutical intermediates, and FMCG chemicals. The trading window for designated persons has been closed from February 1, 2024, and will reopen after 48 hours from the date of declaration of financial results.''',
                'source': 'NSE Announcement',
                'sentiment': 'NEUTRAL'
            },
            # Neutral 2
            {
                'title': 'Clean Science appoints Mr. Rajesh Sinha as Independent Director',
                'content': '''Clean Science and Technology Limited announced the appointment of Mr. Rajesh Sinha as an Additional Director in the category of Independent Director, effective February 1, 2024. Mr. Sinha brings over 30 years of experience in the chemical industry having worked with leading companies in senior leadership roles. His appointment is subject to approval by shareholders at the next general meeting. The Board believes his extensive industry experience will add significant value to the company's strategic initiatives. Mr. Sinha holds a B.Tech in Chemical Engineering from IIT Delhi and an MBA from IIM Ahmedabad.''',
                'source': 'Company Filing',
                'sentiment': 'NEUTRAL'
            }
        ],
        'ASTRAL': [
            # Positive 1
            {
                'title': 'Astral Ltd reports robust Q3 with volume growth of 26% in pipe segment',
                'content': '''Astral Limited delivered strong Q3 FY24 results with consolidated revenue growing 24% YoY to ₹1,450 crore. The pipe segment saw exceptional volume growth of 26% driven by strong demand from agriculture, infrastructure, and building construction. The company's adhesive business also performed well with 18% growth. Operating margins improved by 120 basis points to 17.8% due to favorable PVC prices and operating leverage. Management highlighted strong demand visibility for Q4 and expects to maintain double-digit volume growth momentum. Brokerages remain positive on Astral's structural growth story in pipes and adhesives.''',
                'source': 'Economic Times',
                'sentiment': 'POSITIVE'
            },
            # Positive 2
            {
                'title': 'Astral Ltd completes acquisition of bathroom fittings company',
                'content': '''Astral Limited has successfully completed the acquisition of a premium bathroom fittings company for an undisclosed amount. This acquisition strengthens Astral's presence in the fast-growing building materials segment and provides access to the premium bathware market. The acquired company has a strong brand presence in South India with annual revenues of approximately ₹180 crore. Management expects the acquisition to be earnings accretive from year two onwards. The transaction aligns with Astral's strategy to build a comprehensive building materials portfolio beyond pipes and adhesives.''',
                'source': 'Business Line',
                'sentiment': 'POSITIVE'
            },
            # Negative 1
            {
                'title': 'Astral Ltd faces intense competition as new players enter pipe market',
                'content': '''Astral Limited's management acknowledged increasing competitive intensity in the pipes segment during the recent earnings call. Several new players backed by private equity have entered the market with aggressive pricing strategies. While Astral maintains its market leadership position, the company has seen some pressure on realizations in certain regions. Management indicated they will focus on brand strength and product quality rather than engage in price wars. Some analysts have reduced margin estimates for FY25 citing competitive pressures and potential market share challenges.''',
                'source': 'Moneycontrol',
                'sentiment': 'NEGATIVE'
            },
            # Negative 2
            {
                'title': 'Astral Ltd inventory write-off impacts Q3 profitability',
                'content': '''Astral Limited took an inventory write-off of ₹35 crore in Q3 FY24 related to slow-moving SKUs in its adhesive business. The write-off impacted reported PAT by approximately 12% compared to street estimates. Management explained this is a one-time charge to clean up inventory and rationalize the product portfolio. While the company maintains the underlying business remains healthy, the unexpected write-off disappointed investors. The stock fell 4% in trade following the results announcement. Analysts await more clarity on inventory management practices and working capital efficiency.''',
                'source': 'Bloomberg Quint',
                'sentiment': 'NEGATIVE'
            },
            # Neutral 1
            {
                'title': 'Astral Ltd announces board meeting on February 15 to consider quarterly results',
                'content': '''Astral Limited has informed stock exchanges that a meeting of the Board of Directors is scheduled on Thursday, February 15, 2024, to consider and approve the unaudited financial results for the quarter ended December 31, 2023. The board will review performance across pipe, adhesive, and other building material segments. Trading window for designated persons has been closed from February 1, 2024, and will reopen 48 hours after the results are made public. The company has set February 8 as the record date for the purpose of interim dividend, if declared.''',
                'source': 'BSE Announcement',
                'sentiment': 'NEUTRAL'
            },
            # Neutral 2
            {
                'title': 'Astral Ltd participates in construction industry expo in Mumbai',
                'content': '''Astral Limited showcased its comprehensive range of piping solutions and adhesives at the Construction & Building Materials Expo held in Mumbai from January 25-28, 2024. The company displayed its latest product innovations including fire-resistant pipes, eco-friendly adhesives, and smart plumbing solutions. The expo was attended by architects, builders, contractors, and distributors from across India. Astral's team conducted product demonstrations and engaged with industry stakeholders to understand evolving customer requirements. The company also organized a seminar on sustainable building practices and water conservation.''',
                'source': 'Press Release',
                'sentiment': 'NEUTRAL'
            }
        ]
    }

    # Insert articles
    print("Seeding news articles...")
    print("=" * 80)

    total_inserted = 0

    with engine.begin() as conn:
        for symbol, articles in articles_data.items():
            company = companies[symbol]
            company_id = company['id']
            company_name = company['company_name']

            print(f"\n{company_name} ({symbol}):")

            for i, article in enumerate(articles, 1):
                # Calculate published_at with staggered dates over last 7 days
                days_ago = (i - 1) % 7
                published_at = datetime.now() - timedelta(days=days_ago)

                query = text("""
                    INSERT INTO news_articles (
                        id,
                        company_id,
                        title,
                        full_text,
                        summary,
                        source,
                        url,
                        published_at,
                        sentiment_label,
                        created_at
                    ) VALUES (
                        gen_random_uuid(),
                        :company_id,
                        :title,
                        :full_text,
                        :summary,
                        :source,
                        :url,
                        :published_at,
                        :sentiment_label,
                        NOW()
                    )
                    RETURNING id
                """)

                # Generate a unique URL based on article title
                url = f"https://example.com/news/{symbol.lower()}/{i}-{published_at.strftime('%Y%m%d')}"

                result = conn.execute(query, {
                    'company_id': company_id,
                    'title': article['title'],
                    'full_text': article['content'],
                    'summary': article['content'][:200] + '...',  # First 200 chars as summary
                    'source': article['source'],
                    'url': url,
                    'published_at': published_at,
                    'sentiment_label': article['sentiment']
                })

                article_id = result.fetchone()[0]
                total_inserted += 1

                sentiment_icon = {
                    'POSITIVE': '📈',
                    'NEGATIVE': '📉',
                    'NEUTRAL': '➡️'
                }[article['sentiment']]

                print(f"  {sentiment_icon} {article['sentiment']}: {article['title'][:60]}...")

    print(f"\n{'=' * 80}")
    print(f"✓ Successfully seeded {total_inserted} news articles!")
    print(f"{'=' * 80}\n")


if __name__ == '__main__':
    seed_articles()
