import sys
import json
import requests
import splunk.rest as rest
import splunk.entity as entity

class OpenAIQueryHandler(rest.BaseRestHandler):
    """
    REST handler for OpenAI query conversion
    """
    
    def handle_POST(self):
        """Handle POST requests to convert natural language to SPL"""
        try:
            # Get request payload
            payload = json.loads(self.request['payload'])
            user_query = payload.get('query', '')
            indexes = payload.get('indexes', '')
            fields = payload.get('fields', '')
            
            if not user_query:
                return {'error': 'No query provided'}
            
            # Get configuration
            config = self.get_config()
            api_key = config.get('openai_api_key')
            model = config.get('openai_model', 'gpt-4')
            default_indexes = config.get('default_indexes', 'main')
            default_fields = config.get('default_fields', 'host,source,sourcetype')
            
            if not api_key:
                return {'error': 'OpenAI API key not configured'}
            
            # Use provided or default indexes/fields
            final_indexes = indexes if indexes else default_indexes
            final_fields = fields if fields else default_fields
            
            # Convert natural language to SPL
            spl_query, chart_type = self.convert_to_spl(
                user_query, 
                api_key, 
                model,
                final_indexes,
                final_fields
            )
            
            # Execute the SPL query
            results = self.execute_spl(spl_query)
            
            return {
                'success': True,
                'original_query': user_query,
                'spl_query': spl_query,
                'chart_type': chart_type,
                'results': results,
                'indexes': final_indexes,
                'fields': final_fields
            }
            
        except Exception as e:
            return {'error': str(e)}
    
    def get_config(self):
        """Retrieve app configuration"""
        try:
            settings = entity.getEntity(
                '/configs/conf-ai_query_app',
                'settings',
                namespace='ai_query_app',
                owner='nobody',
                sessionKey=self.sessionKey
            )
            return settings
        except:
            return {}
    
    def convert_to_spl(self, query, api_key, model, indexes, fields):
        """Convert natural language query to SPL using OpenAI"""
        
        system_prompt = f"""You are an expert Splunk SPL (Search Processing Language) converter.
Convert natural language queries into valid Splunk SPL queries.

Available indexes: {indexes}
Available fields: {fields}

Rules:
1. Always start with 'index=' or 'search index='
2. Use proper SPL syntax (stats, eval, timechart, etc.)
3. Include appropriate time ranges if mentioned
4. For visualizations, use timechart, chart, or stats as appropriate
5. Return ONLY the SPL query and chart type
6. Format: {{"spl": "your query here", "chart_type": "line|bar|pie|table"}}

Example:
User: "Show me error count by host in last hour"
Response: {{"spl": "index=main error earliest=-1h | stats count by host", "chart_type": "bar"}}
"""
        
        try:
            response = requests.post(
                'https://api.openai.com/v1/chat/completions',
                headers={
                    'Authorization': f'Bearer {api_key}',
                    'Content-Type': 'application/json'
                },
                json={
                    'model': model,
                    'messages': [
                        {'role': 'system', 'content': system_prompt},
                        {'role': 'user', 'content': query}
                    ],
                    'temperature': 0.3,
                    'max_tokens': 500
                },
                timeout=30
            )
            
            if response.status_code == 200:
                result = response.json()
                content = result['choices'][0]['message']['content']
                
                # Parse JSON response
                try:
                    parsed = json.loads(content)
                    return parsed.get('spl', ''), parsed.get('chart_type', 'table')
                except:
                    # Fallback if not JSON
                    return content.strip(), 'table'
            else:
                raise Exception(f"OpenAI API error: {response.status_code}")
                
        except Exception as e:
            raise Exception(f"Error calling OpenAI: {str(e)}")
    
    def execute_spl(self, spl_query):
        """Execute SPL query and return results"""
        import splunklib.client as client
        import splunklib.results as results
        
        try:
            # Create service connection
            service = client.connect(
                token=self.sessionKey,
                owner='nobody',
                app='ai_query_app'
            )
            
            # Run search
            kwargs = {
                'earliest_time': '-24h',
                'latest_time': 'now'
            }
            
            job = service.jobs.create(spl_query, **kwargs)
            
            # Wait for job to complete
            while not job.is_done():
                pass
            
            # Get results
            result_list = []
            for result in results.ResultsReader(job.results()):
                if isinstance(result, dict):
                    result_list.append(result)
            
            return result_list[:1000]  # Limit results
            
        except Exception as e:
            raise Exception(f"Error executing SPL: {str(e)}")

# Required for Splunk to recognize the handler
def handle(method, in_string, sessionKey=None):
    """Entry point for REST handler"""
    handler = OpenAIQueryHandler(method, in_string, sessionKey)
    return handler.handle()
