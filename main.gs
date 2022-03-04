//Settings of properties for the project
//How to use Ex：const calendarId = PropertiesService.getUserProperties().getProperty('calendarId');
function initUserProperties() {
  const properties = PropertiesService.getUserProperties();
  properties.setProperties({
    // "notionToken" : "",//Notion token // !!!SET HERE !!!
    "notionDbId" : "",//Notion database ID // !!!SET HERE !!!
    "taskListId":"",//Google task list ID // !!!SET HERE !!!
    "calendarId": "",//Google Calendar ID // !!!SET HERE !!!
    "nameProp" : "Title",//	Notion database task 'title' column name // !!!SET HERE !!!
    "dateProp" : "Date",//Notion database 'task due' column name // !!!SET HERE !!!
    "taskIdProp" : "taskId",//Notion database 'Google task ID' column name // !!!SET HERE !!!
    "doneStatusProp" : "Done",//Notion database 'Commpleted status' column name // !!!SET HERE !!!
    "notesProp" : "Google tasks notes",//Notion database 'Google tasks notes' column name // !!!SET HERE !!!
    "notionPrefix" : "https://www.notion.so/",
    "daysForSearch" : 31,//Search only for tasks within x days before and after the time of execution
    "isLogging" : true,//Whether to keep a log or not
    "staySecond":0,//Number of seconds to wait to avoid request limitation during POST on notion page
    "notionVersion":"2021-08-16",
    "notionLastUpdatePeriod":15,//(minutes) If the notion page is updated within fat minutes, it will be reflected in the Google task.
    "googleLastUpdatePeriod":1000//(seconds) Only Google tasks that are updated within ◯ seconds are reflected in the notion task.
  });
}

//google task => action to notion
//Trigger setting: when update is detected on google calendar
function GoogleTaskToNotion(){
  initUserProperties();
  const isLogging = PropertiesService.getUserProperties().getProperty('isLogging')
  const infoNotion = new InfoNotion();
  const infoTask = new InfoTask();

  if (isLogging) console.log("↓************** START : GoogleTaskToNotion()  **************↓");
  const json = infoTask.getUpdatedTasks();
  if(json){
    json.forEach((googleTask) =>{
    // infoNotion.dump(googleTask);Display contents of json
    infoNotion.googleTaskManager(googleTask);
    });
  };
  if (isLogging) console.log("↑************** FINISH : GoogleTaskToNotion()  **************↑");
};


//notion => action to google task
//Trigger configuration settings: load notion tasks on a time periodic basis
function NotionToGoogleTask(){
  initUserProperties();
  const infoNotion = new InfoNotion();
  const infoTask = new InfoTask();
  const isLogging = PropertiesService.getUserProperties().getProperty('isLogging');

  if (isLogging) console.log("↓************** START : NotionToGoogleTask()  **************↓");
  const notionLastUpdatePeriod = PropertiesService.getUserProperties().getProperty('notionLastUpdatePeriod');
  const lastUpdate = Utilities.formatDate(
      infoTask.addMinute(new Date(), notionLastUpdatePeriod * -1),
      "JST", 
      "yyyy-MM-dd'T'HH:mm:ssXXX"
    );

  const json = infoNotion.fetchNotion(lastUpdate);
  json.results = json.results.sort((a, b) => a.last_edited_time > b.last_edited_time ? -1 : 1);

  let queryCount = 0;
  json.results
    .forEach((notionPage) => {
      if (new Date(notionPage.last_edited_time) > new Date(lastUpdate) &&
        infoNotion.isValidPage(notionPage)) {// If the notion task page has been updated within the current notionLastUpdatePeriod minute
        infoNotion.notionTaskManager(notionPage);
        queryCount += 1;
      };
    });
    if(queryCount == 0){
      if (isLogging) console.log("SKIP all process of NotionToGoogleTask()"
      + "\n( not updated task in notion within "+ notionLastUpdatePeriod +" minutes )")
    };
  if (isLogging) console.log("↑************** FINISH : NotionToGoogleTask()  **************↑");
};


// Get the id of the all task list associated with the google account(calendarId)
function CheckAllTaskList(){
  initUserProperties();
  const isLogging = PropertiesService.getUserProperties().getProperty('isLogging');
  const infoTask = new InfoTask();
  const taskList = infoTask.getTaskLists();
  if(!taskList ==  []){
    if (isLogging) console.log("--------- Your task list ---------");
    taskList.forEach((taskListInfo) => {
      if (isLogging) console.log(taskListInfo.name + " : " + taskListInfo.id);
    });
  }else{
    if (isLogging) console.log("--------- No task list ---------");
  };
};
