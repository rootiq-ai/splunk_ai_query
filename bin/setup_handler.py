import splunk.admin as admin
import splunk.entity as entity
import json

class ConfigApp(admin.MConfigHandler):
    """
    Handler for saving and retrieving configuration settings
    """
    
    def setup(self):
        if self.requestedAction == admin.ACTION_EDIT:
            for arg in ['openai_api_key', 'openai_model', 'default_indexes', 
                       'default_fields', 'max_results', 'default_time_range']:
                self.supportedArgs.addOptArg(arg)

    def handleList(self, confInfo):
        """List current configuration"""
        confDict = self.readConf("ai_query_app")
        if None != confDict:
            for stanza, settings in confDict.items():
                for key, val in settings.items():
                    if key in ['openai_api_key'] and val:
                        val = '******'
                    confInfo[stanza].append(key, val)

    def handleEdit(self, confInfo):
        """Save configuration"""
        name = self.callerArgs.id
        args = self.callerArgs
        
        # Write to conf file
        self.writeConf('ai_query_app', 'settings', self.callerArgs.data)
        
        # Mark app as configured
        app_conf = entity.getEntity('/apps/local', 'ai_query_app', 
                                    namespace='ai_query_app', 
                                    owner='nobody',
                                    sessionKey=self.getSessionKey())
        app_conf['configured'] = True
        entity.setEntity(app_conf, sessionKey=self.getSessionKey())

# Initialize the handler
admin.init(ConfigApp, admin.CONTEXT_NONE)
