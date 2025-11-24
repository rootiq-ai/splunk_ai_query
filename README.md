# AI Query Assistant for Splunk

Convert natural language queries to SPL using OpenAI and visualize results.

## Features

- Natural language to SPL conversion using OpenAI
- Multiple visualization types (table, bar, line, pie charts)
- Configurable indexes and fields
- Real-time query execution
- Copy generated SPL queries
- Save configuration preferences

## Installation

### Prerequisites

- Splunk Enterprise 8.0+ or Splunk Cloud
- OpenAI API key
- Python 3.7+
- Required Python packages:
  - `requests`
  - `splunk-sdk` (usually pre-installed)

### Step 1: Install Python Dependencies

```bash
cd $SPLUNK_HOME/bin
./pip install requests splunk-sdk
```

### Step 2: Deploy the App

1. Create the directory structure:
```bash
mkdir -p $SPLUNK_HOME/etc/apps/ai_query_app/{default,bin,appserver/static}
```

2. Copy all files to their respective locations:
   - `app.conf` → `$SPLUNK_HOME/etc/apps/ai_query_app/default/`
   - `setup.xml` → `$SPLUNK_HOME/etc/apps/ai_query_app/default/`
   - `restmap.conf` → `$SPLUNK_HOME/etc/apps/ai_query_app/default/`
   - `openai_query.py` → `$SPLUNK_HOME/etc/apps/ai_query_app/bin/`
   - `setup_handler.py` → `$SPLUNK_HOME/etc/apps/ai_query_app/bin/`
   - `ai_query.html` → `$SPLUNK_HOME/etc/apps/ai_query_app/appserver/static/`
   - `ai_query.js` → `$SPLUNK_HOME/etc/apps/ai_query_app/appserver/static/`
   - `ai_query.css` → `$SPLUNK_HOME/etc/apps/ai_query_app/appserver/static/`

3. Set proper permissions:
```bash
chmod +x $SPLUNK_HOME/etc/apps/ai_query_app/bin/*.py
```

### Step 3: Restart Splunk

```bash
$SPLUNK_HOME/bin/splunk restart
```

### Step 4: Configure the App

1. Navigate to **Apps → Manage Apps** in Splunk Web
2. Find "AI Query Assistant" and click **Set up**
3. Enter your configuration:
   - **OpenAI API Key**: Your OpenAI API key
   - **OpenAI Model**: `gpt-4` or `gpt-3.5-turbo`
   - **Default Indexes**: Comma-separated list (e.g., `main,security`)
   - **Default Fields**: Comma-separated list (e.g., `host,source,sourcetype`)
   - **Maximum Results**: Limit for query results (default: 1000)
   - **Default Time Range**: Default time window for queries

4. Click **Save**

## Usage

### Basic Query

1. Open the app from Splunk's app menu
2. (Optional) Configure indexes and fields for this session
3. Enter your question in natural language:
   - "Show me error count by host in last hour"
   - "Top 10 sources with highest event count today"
   - "Failed login attempts by user"
4. Click **Generate Query**
5. View the generated SPL and results

### Example Queries

**Error Analysis:**
```
Show me all errors in the last 24 hours grouped by host
```

**Performance Monitoring:**
```
What are the top 5 slowest response times by endpoint today?
```

**Security:**
```
Find failed SSH login attempts in the last week
```

**Traffic Analysis:**
```
Show HTTP status codes distribution for the main index
```

### Customizing Indexes and Fields

Before submitting a query, you can specify:

- **Indexes**: Which indexes to search (e.g., `web,security,app`)
- **Fields**: Available fields for the query (e.g., `host,user,status,action`)

These settings help OpenAI generate more accurate SPL queries.

### Working with Results

- **Table View**: Default view showing all fields
- **Bar Chart**: For count/aggregate visualizations
- **Line Chart**: For time-series data
- **Pie Chart**: For distribution analysis

**Copy Query**: Click the "Copy Query" button to copy the SPL to your clipboard for use in Splunk Search.

## Configuration Files

### app.conf
Defines app metadata and configuration status.

### setup.xml
Provides the configuration UI for OpenAI and default settings.

### restmap.conf
Configures REST endpoints for the Python handlers.

### openai_query.py
Main script that:
- Connects to OpenAI API
- Converts natural language to SPL
- Executes queries
- Returns formatted results

### setup_handler.py
Handles saving and retrieving configuration.

## Troubleshooting

### "OpenAI API key not configured"
- Go to App Setup and enter your OpenAI API key
- Restart Splunk after configuration

### "Error executing SPL"
- Check that the generated SPL is valid
- Verify you have access to the specified indexes
- Check Splunk search permissions

### Connection Errors
- Verify internet connectivity
- Check firewall settings for OpenAI API access
- Ensure API key is valid

### No Results
- Check time range settings
- Verify index and field names are correct
- Try a simpler query first

## API Rate Limits

OpenAI has rate limits based on your account tier. For production use:
- Use GPT-3.5-turbo for faster, cheaper queries
- Implement caching for common queries
- Monitor your API usage

## Security Considerations

- **API Keys**: Stored encrypted in Splunk's password storage
- **Permissions**: Configure appropriate Splunk role-based access
- **Data Privacy**: Ensure your OpenAI usage complies with data policies
- **Network**: Consider using a proxy for API calls in restricted environments

## Advanced Configuration

### Custom Prompts

Edit `openai_query.py` to customize the system prompt for better results specific to your environment.

### Additional Models

The app supports any OpenAI chat model:
- `gpt-4`: Most capable, slower, more expensive
- `gpt-3.5-turbo`: Fast, cost-effective
- `gpt-4-turbo`: Balanced performance

### Query Optimization

For better SPL generation:
- Provide comprehensive field lists
- Include field descriptions in the prompt
- Use specific terminology matching your data

## Support

For issues and feature requests:
1. Check the Splunk logs: `$SPLUNK_HOME/var/log/splunk/`
2. Review `splunkd.log` for Python errors
3. Enable debug logging in `openai_query.py`

## License

This app is provided as-is for educational and commercial use.

## Version History

**v1.0.0** - Initial release
- Natural language to SPL conversion
- Multiple visualization types
- Configurable indexes and fields
- OpenAI integration

---

**Note**: This app sends your queries to OpenAI's API. Ensure this complies with your organization's data policies.
