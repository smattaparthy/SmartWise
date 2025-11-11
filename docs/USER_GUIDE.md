# SmartWise Investment Assistant - User Guide

## Getting Started

### 1. Registration

Visit http://localhost:3200 and click "Get Started" or "Sign Up".

- **Email**: Enter a valid email address
- **Password**: Choose a secure password (minimum 8 characters)
- Click **"Register"**

After successful registration, you'll be automatically logged in and redirected to onboarding.

### 2. Onboarding Questionnaire

Complete the 10-question assessment to determine your investor persona. Answer honestly based on your current situation:

**Step 1: Investment Profile** (Questions 1-3)
- Experience level (beginner/intermediate/advanced)
- Current portfolio status (none/small/substantial)
- Risk tolerance (low/moderate/high)

**Step 2: Investment Goals** (Questions 4-7)
- Primary goal (preservation/growth/aggressive)
- Time commitment (minimal/moderate/active)
- Time horizon (short/medium/long-term)
- Market reaction (nervous/concerned/opportunistic)

**Step 3: Preferences** (Questions 8-10)
- Advice type (simple/analysis/ideas)
- Diversification importance (critical/important/flexible)
- Age range (under 30/30-50/over 50)

After submission, you'll receive your persona assignment with confidence score and reasoning.

---

## Personas Explained

### Persona A - Starter 🌱

**For**: New investors or those seeking simplicity

**Features**:
- **Index Fund Recommendations**: Curated list of low-cost ETFs
  - VOO (S&P 500)
  - VTI (Total Stock Market)
  - VXUS (International)
  - BND (Bonds)
  - VNQ (Real Estate)

- **Portfolio Strategies**:
  - **Conservative** (80% stocks / 20% bonds): Lower risk, stable growth
  - **Balanced** (60% stocks / 40% bonds): Moderate risk/reward
  - **Growth** (90% stocks / 10% bonds): Higher risk, maximum growth

- **Fund Details**: Expense ratios, asset classes, descriptions

**Best For**: Beginners who want simple, proven investment approaches

---

### Persona B - Rebalance ⚖️

**For**: Existing portfolio owners seeking optimization

**Features**:

#### Portfolio Upload
Upload your holdings via CSV file:
```csv
symbol,shares,purchase_price
AAPL,100,150.00
MSFT,50,280.00
GOOGL,25,2500.00
```

#### Portfolio Analysis
- **Total Value**: Current portfolio worth
- **Sector Allocation**: Percentage breakdown by sector
- **Diversification Score**: 0-1 scale (0=concentrated, 1=diversified)
- **Concentration Warnings**: Sectors with >30% allocation

#### Rebalancing Recommendations
Choose your target model:
- **Conservative**: Balanced across 11 sectors (max 15% per sector)
- **Balanced**: Growth focus (25% tech, diversified)
- **Growth**: Aggressive (40% tech, 20% healthcare)

Receive AI-powered recommendations:
- Buy/sell specific stocks
- Number of shares to trade
- Dollar amounts
- **AI Reasoning**: Personalized explanations from Claude 3.5 Sonnet

**Best For**: Investors with existing portfolios who want professional-grade analysis and actionable rebalancing plans

---

### Persona C - Moonshot 🚀

**For**: Advanced investors seeking research insights

**Features**:

#### Research Assistant Chatbot
- Ask investment research questions
- Get RAG-powered responses based on curated documents
- Source citations with relevance scores
- Conversation history maintained

#### Sample Questions
- "What are key factors in evaluating semiconductor stocks?"
- "How do interest rates affect REIT valuations?"
- "What makes a company's moat defensible?"

#### Research Documents
- Browse available research materials
- View document categories
- Access curated investment insights

**Best For**: Experienced investors who want research-backed insights for advanced strategies

---

## Key Features

### Persona Reassessment

Your circumstances change - so can your persona!

**Access**: Click **"Reassess"** button in the top-right header (next to your persona badge)

**When to Reassess**:
- Your portfolio size changed significantly
- Your risk tolerance evolved
- You gained investment experience
- Your time horizon shortened
- You want different types of advice

**Process**:
1. Complete the same 10-question assessment
2. System calculates your new persona
3. See your change: "Updated from B to A"
4. Dashboard automatically updates with new features

---

## Common Workflows

### Workflow 1: New Investor Getting Started (Persona A)

1. **Register & Complete Onboarding**
   - Answer 10 questions honestly
   - Receive Persona A assignment

2. **Review Recommendations**
   - Go to Dashboard → Starter
   - Browse index fund options
   - Compare expense ratios

3. **Choose Strategy**
   - Select Conservative (80/20) for safety
   - Select Balanced (60/40) for moderate growth
   - Select Growth (90/10) for maximum returns

4. **Take Action**
   - Note recommended funds and allocations
   - Open brokerage account
   - Purchase recommended ETFs

### Workflow 2: Portfolio Optimization (Persona B)

1. **Prepare Portfolio Data**
   - Export holdings from your brokerage
   - Format as CSV: `symbol,shares,purchase_price`
   - Save file locally

2. **Upload & Analyze**
   - Go to Dashboard → Rebalance
   - Click "Upload Portfolio CSV"
   - Review analysis:
     - Total value
     - Sector breakdown
     - Diversification score (aim for 0.7+)
     - Concentration warnings

3. **Get Rebalancing Plan**
   - Choose target model (conservative/balanced/growth)
   - Click "Generate Rebalancing Suggestions"
   - Review AI-powered recommendations

4. **Execute Trades**
   - Note buy/sell recommendations
   - Understand AI reasoning for each trade
   - Execute trades in your brokerage
   - Re-upload portfolio to verify

### Workflow 3: Research-Driven Investing (Persona C)

1. **Ask Research Questions**
   - Go to Dashboard → Moonshot
   - Type your investment question
   - Click "Ask"

2. **Review Insights**
   - Read AI-generated response
   - Check source citations
   - Note relevance scores
   - Explore referenced documents

3. **Follow-Up Questions**
   - Ask clarifying questions
   - Dive deeper into specific topics
   - Build on previous answers

4. **Make Investment Decisions**
   - Use research to inform strategy
   - Validate thesis with multiple sources
   - Consider risk factors mentioned

---

## Tips & Best Practices

### For All Personas

✅ **Do**:
- Answer onboarding questions honestly
- Reassess when circumstances change
- Review AI reasoning carefully
- Verify information independently
- Consult a financial advisor for major decisions

❌ **Don't**:
- Rush through onboarding
- Blindly follow recommendations
- Invest money you can't afford to lose
- Treat this as professional financial advice

### For Persona A (Starter)

✅ **Do**:
- Start with recommended index funds
- Choose allocation matching your risk tolerance
- Invest regularly (dollar-cost averaging)
- Keep expense ratios low (<0.20%)
- Rebalance annually

❌ **Don't**:
- Pick individual stocks initially
- Chase performance
- Check portfolio daily
- Panic sell during downturns

### For Persona B (Rebalance)

✅ **Do**:
- Upload accurate portfolio data
- Review sector concentration
- Understand rebalancing reasoning
- Consider tax implications of trades
- Rebalance when >5% deviation

❌ **Don't**:
- Rebalance too frequently (creates taxes)
- Ignore diversification warnings
- Sell solely because of allocation
- Forget about transaction costs

### For Persona C (Moonshot)

✅ **Do**:
- Ask specific, detailed questions
- Verify information from multiple sources
- Check source document relevance
- Consider contrarian viewpoints
- Maintain disciplined risk management

❌ **Don't**:
- Rely on single sources
- Ignore risk factors
- Over-concentrate positions
- Trade based on incomplete research

---

## Troubleshooting

### Can't Log In
- **Problem**: "Invalid email or password"
- **Solution**:
  - Verify email address is correct
  - Check password (case-sensitive)
  - Register if you haven't created an account

### Persona Not Assigned
- **Problem**: Dashboard says "Complete onboarding"
- **Solution**:
  - Go to /onboarding
  - Complete all 10 questions
  - Submit answers

### CSV Upload Fails
- **Problem**: "Invalid CSV format"
- **Solution**:
  - Use format: `symbol,shares,purchase_price`
  - No spaces in column names
  - Ensure all rows have 3 columns
  - Save as `.csv` (not `.xlsx`)

### No Rebalancing Suggestions
- **Problem**: "No rebalancing needed"
- **Solution**:
  - This means portfolio is well-balanced!
  - Allocations are within 5% of targets
  - Try different model if you want to see alternatives
  - Check back after portfolio changes

### Ticker Not Found
- **Problem**: "Ticker not found" or "Unknown sector"
- **Solution**:
  - Verify ticker symbol is correct (e.g., "AAPL" not "Apple")
  - Use US-listed stocks only
  - Check if ticker is in mock data (AAPL, MSFT, NVDA, INTC, LLY, SPY, VTI)
  - Wait if rate-limited, system will retry

### Chatbot Not Responding (Persona C)
- **Problem**: No response to research questions
- **Solution**:
  - Check if question was submitted (click "Ask")
  - Ensure research documents are loaded
  - Try rephrasing question
  - Check backend logs for errors

---

## Security & Privacy

### Data Storage
- **Passwords**: Hashed with bcrypt (never stored in plaintext)
- **Tokens**: JWT with 60-minute expiry
- **Portfolio Data**: Stored locally in SQLite database
- **Research Queries**: Not permanently stored

### Best Practices
- Use strong, unique passwords
- Log out on shared devices
- Never share your JWT token
- Review permissions before granting access

### Data Deletion
- Contact support to delete your account
- All portfolio data will be removed
- Email and registration data will be deleted

---

## Frequently Asked Questions

**Q: Is this financial advice?**
A: No. SmartWise is an educational tool. Always consult a licensed financial advisor before making investment decisions.

**Q: How accurate are the AI recommendations?**
A: AI recommendations are generated by Claude 3.5 Sonnet using your portfolio context. They should be verified independently and considered as one input among many for investment decisions.

**Q: Can I change my persona?**
A: Yes! Click "Reassess" in the header, complete the questionnaire, and your persona will update based on your new answers.

**Q: Why do I see mock data for some tickers?**
A: The free Alpha Vantage API has rate limits (5 requests/minute). When rate-limited, the system falls back to mock data for common tickers to ensure functionality.

**Q: How is my portfolio value calculated?**
A: Current implementation uses purchase price * 1.1 (mock 10% gain). Production version would fetch real-time prices from market data APIs.

**Q: What's the difference between Conservative, Balanced, and Growth models?**
A:
- **Conservative**: Maximum diversification across 11 sectors, no sector >15%
- **Balanced**: Growth tilt with 25% tech, diversified across 8 sectors
- **Growth**: Aggressive with 40% tech, 20% healthcare, concentrated in 5 growth sectors

**Q: How often should I rebalance?**
A: General guidance:
- Review quarterly
- Rebalance when allocations drift >5% from targets
- Consider tax implications (prefer rebalancing in tax-advantaged accounts)
- Annual rebalancing is sufficient for most investors

**Q: Can I use this with my 401(k)?**
A: The principles apply, but check your plan's available funds. Most 401(k)s offer similar index fund options to those recommended.

**Q: Is my portfolio data shared?**
A: No. Your portfolio data is stored locally and never shared with third parties.

---

## Getting Help

### In-App Help
- Hover over ℹ️ icons for quick tips
- Read error messages carefully
- Check validation messages on forms

### Documentation
- **Architecture**: Technical system design
- **API Reference**: Complete endpoint documentation
- **This Guide**: User-focused instructions

### Support Channels
- **GitHub Issues**: Bug reports and feature requests
- **Email**: support@smartwise.example.com
- **API Docs**: http://localhost:8200/docs

---

## What's Next

### Upcoming Features
- Real-time market data integration
- Portfolio performance tracking
- Tax-loss harvesting suggestions
- Dividend reinvestment planning
- Multi-currency support

### Roadmap
- Q1 2025: Enhanced AI reasoning with context
- Q2 2025: Mobile app release
- Q3 2025: Social features and community insights
- Q4 2025: Advanced portfolio analytics

---

## Disclaimer

**This is not financial advice.** SmartWise Investment Assistant is an educational tool designed to help you explore investment concepts and organize portfolio information. All investment decisions should be made in consultation with a licensed financial advisor who understands your complete financial situation, goals, and risk tolerance.

**Past performance does not guarantee future results.** Investing involves risk, including potential loss of principal. The information provided is for educational purposes only and should not be considered as personalized investment advice.

**Do your own research.** Verify all information independently before making investment decisions. Consider your own financial situation, goals, and risk tolerance.
