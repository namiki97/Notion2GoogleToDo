//class and method for Notion process
class InfoNotion{
  //Inside this corresponds to the contents of initUserProperties() (no need prop is called)
  constructor() {
    this.infoTask = new InfoTask(),
    this.notionToken = PropertiesService.getUserProperties().getProperty('notionToken'),
    this.notionDbId = PropertiesService.getUserProperties().getProperty('notionDbId'),
    this.notionPrefix = PropertiesService.getUserProperties().getProperty('notionPrefix'),
    this.nameProp = PropertiesService.getUserProperties().getProperty('nameProp'),
    this.dateProp = PropertiesService.getUserProperties().getProperty('dateProp'),
    this.taskIdProp = PropertiesService.getUserProperties().getProperty('taskIdProp'),
    this.doneStatusProp = PropertiesService.getUserProperties().getProperty('doneStatusProp'),
    this.notesProp = PropertiesService.getUserProperties().getProperty('notesProp'),
    this.daysForSearch = PropertiesService.getUserProperties().getProperty('daysForSearch'),
    this.isLogging = PropertiesService.getUserProperties().getProperty('isLogging'),
    this.staySecond = PropertiesService.getUserProperties().getProperty('staySecond'),
    this.notionVersion = PropertiesService.getUserProperties().getProperty('notionVersion'),
    this.notionLastUpdatePeriod = PropertiesService.getUserProperties().getProperty('notionLastUpdatePeriod')
  }

  //View all read notion database information
  dump(notionPage) {
    console.log(notionPage);  
  };

  //Add the date by the amount of the value.
  addDate(date, value) {
    return new Date(date.setDate(date.getDate() + value));
  };

  //Determine if it is a valid type of notion data
  // Look for a match in the notion column name
  isValidPage(notionPage) {
    return (
      this.nameProp in notionPage.properties &&
      this.dateProp in notionPage.properties
    );
  };

  // Get taskId (verify if it has been registered from notion in the past)
  // If notion's taskId = "", then task = "" is output
  getTask(props) {
    const taskId = this.getRichText(props[this.taskIdProp]);//taskId or ""
    const task = this.infoTask.getTask(taskId);
    return task;
  };

  //Convert text props to text
  getRichText(prop) {
    if (!prop) return "";
    // if(!prop.rich_text) return "";
    if (prop.rich_text.length == 0) return "";
    return prop.rich_text[0].plain_text;
  };

  //Format date
  formatDate(date) {
    const newDate = Utilities.formatDate(new Date(date), "JST", "yyyy-MM-dd");  
    return newDate;
  };

  //Format date
  isSameDate(date1, date2) {
    return this.formatDate(date1) == this.formatDate(date2);
  };


  // Add date format new task to google todo
  createTask(props, pageId) {
    const title = props[this.nameProp].title[0].plain_text;
    // const notes = this.notionPrefix + pageId;//Put a Notion page link in the task details.
    const notionNotes = this.getRichText(props[this.notesProp]);
    const notes = this.notionPrefix + pageId + "\n" + notionNotes;//notesPropnotes with notion page link in task details
    const dueStr = this.infoTask.getDueStr(props[this.dateProp].date.start);

    const task = this.infoTask.addTask(title,notes,dueStr);// Add new task

    this.sendTaskIdToNotion(task,pageId)//Pass taskId to notion
    return task;
  };

  //Send taskId to the notion side
  sendTaskIdToNotion(task,pageId){
    const properties = {};
    properties[this.taskIdProp] = [{ type: "text", text: { content: task.id} }];//taskIdカラムにtaskIdを入力する
    this.postNotion("/pages/" + pageId, { properties: properties, }, "PATCH");
  };

  //Sends Notes to the Notion side
  sendTaskNotesToNotion(task,pageId,newNotionNotes){
    const properties = {};
    properties[this.notesProp] = [{ type: "text", text: { content: newNotionNotes} }];//Enter notes in the Google notes column
    this.postNotion("/pages/" + pageId, { properties: properties, }, "PATCH");
  };


  //Send task status to the notion side
  sendTaskStatusToNotion(task,pageId){//completed: true = completed, false = not completed
    const properties = {};
    properties[this.doneStatusProp] =  {type: "checkbox",  checkbox: task.completedBoolean};//Assign completed to this.statusProp column
    this.postNotion("/pages/" + pageId, { properties: properties, }, "PATCH");
  };

  //Send due deadline to notion side
  sendDueToNotion(dueStr,pageId){
    const properties = {};
    properties[this.dateProp] = {type: "date", date: { start: dueStr}};//Enter due in this.dateProp column
    this.postNotion("/pages/" + pageId, { properties: properties, }, "PATCH");
  };

  //Update notion task name to task.title
  sendTaskTitleToNotion(task,pageId){
    const properties = {};
    properties[this.nameProp] = { title: [{ text: {content : task.title}} ]};//Enter the taskId in the taskId column
    this.postNotion("/pages/" + pageId, { properties: properties, }, "PATCH");
  };
  // removeTask(task, pageId) {
  //   const properties = {};
  //   properties[taskIdProp] = [{ type: "text", text: { content: "" } }];
  //   postNotion("/pages/" + pageId, { properties: properties, }, "PATCH");
  //   task.deleteEvent();
  // };

  //Create a new task on notion page
  createNotionPage(task){
    const properties = {};
    const dueStr = this.formatDate(task.due);
    properties[this.nameProp] =  { title: [{ text: {content : task.title}} ]};
    properties[this.dateProp] = {type: "date", date: { start: dueStr}};
    properties[this.doneStatusProp] =  {type: "checkbox",  checkbox: task.completedBoolean};
    properties[this.taskIdProp] = {rich_text: [{text: {content: task.id}}]};
    if(task.notes){//If notes exists
      properties[this.notesProp] = {rich_text: [{text: {content:task.notes}}]};
    };
    //The notion page url does not exist in NOTES at this time


    // Add any further defaults to be added.!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!

    //Pass properties and create a new page in notion
    const notionPage  = this.postNotionNewPage(properties);

    //Add notion page url to google task
    this.checkTaskNotesNotionUrl(task,notionPage.url);


  };

  //POST or PATCH to Notion
  postNotionNewPage(properties) {
    const api = "https://api.notion.com/v1" + "/pages";
    const headers = {
      "Authorization": "Bearer " + this.notionToken,
      "Content-Type": "application/json",
      "Notion-Version": this.notionVersion
    };
    const payload ={}
    payload["parent"] = {database_id : this.notionDbId,};
    payload["properties"] = properties;
    Utilities.sleep(this.staySecond * 1000);

    // //For Error Verification
    // try {
    //   UrlFetchApp.fetch(
    //     api,
    //     {
    //       headers: headers,
    //       method: "POST",
    //       payload: JSON.stringify(payload),
    //     }
    //   );
    // } catch(e) {// Error display support
    //   if (this.isLogging) console.log('!!!Creatin new notion page ERROR (POST)!!!');
    //   if (this.isLogging) console.log(Object.prototype.toString.call(e));
    //   const resForTest = UrlFetchApp.fetch(
    //     api,
    //     {
    //       headers: headers,
    //       method:  "POST",
    //       payload: JSON.stringify(payload),
    //       muteHttpExceptions : true
    //     }
    //   );
    //   if (this.isLogging) console.log(resForTest.getContentText());//Display all error messages
    // };

    //Function actually passing res (using muteHttpExceptions : true)
    const res = UrlFetchApp.fetch(
      api,
      {
        headers: headers,
        method: "POST",
        payload: JSON.stringify(payload),
        muteHttpExceptions : true
      }
    );
    const json = JSON.parse(res.getContentText('UTF-8'));//Convert res to string
    return json;
  };

  //POST or PATCH to Notion
  postNotion(endpoint, payload, method) {
    const api = "https://api.notion.com/v1" + endpoint;
    const headers = {
      "Authorization": "Bearer " + this.notionToken,
      "Content-Type": "application/json",
      "Notion-Version": this.notionVersion
    };
    Utilities.sleep(this.staySecond * 1000);
    //For error verification
    try {
      UrlFetchApp.fetch(
        api,
        {
          headers: headers,
          method: method ||"POST",
          payload: JSON.stringify(payload),
        }
      );//Argument method = null and if POST (default)
    } catch(e) {// Error display support
      if(!method){
        if (this.isLogging) console.log('!!!Notion page POST ERROR!!!');
      }else{
        if (this.isLogging) console.log('!!!Notion page ' + method + ' ERROR!!!');
      };
      if (this.isLogging) console.log(Object.prototype.toString.call(e));
      const resForTest = UrlFetchApp.fetch(
        api,
        {
          headers: headers,
          method: method || "POST",
          payload: JSON.stringify(payload),
          muteHttpExceptions : true
        }
      );
      if (this.isLogging) console.log(resForTest.getContentText());//Display all error messages
    };
    //Function actually passing res (using muteHttpExceptions : true)
    const res = UrlFetchApp.fetch(
      api,
      {
        headers: headers,
        method: method || "POST",
        payload: JSON.stringify(payload),
        muteHttpExceptions : true
      }
    );
    const json = JSON.parse(res.getContentText('UTF-8'));//Convert res to string
    return json;
  };

　//notionを読み込
  fetchNotion(lastAccess) {
    const beforeThisDate = Utilities.formatDate(this.addDate(new Date(), this.daysForSearch * 1), "JST", "yyyy-MM-dd");
    const afterThisDate = Utilities.formatDate(this.addDate(new Date(), this.daysForSearch * -1), "JST", "yyyy-MM-dd");

    // Logger.log("afterThisDate :" + afterThisDate);
    // Logger.log("beforeThisDate :" + beforeThisDate);

    //Filter: "date is not null" && "date is within this.daysForSearch before/after".
    const payload = {
      sorts: [{ property: this.dateProp, direction: "descending" }],
      filter: {
        and : [{
            and : [
              {property: this.nameProp,  title:{is_not_empty : true}},
              {property: this.dateProp, date: { is_not_empty: true, } }
            ]},
          {
            and :[
              { property: this.dateProp, date: { after: afterThisDate } },
              { property: this.dateProp, date: { before: beforeThisDate } }
            ]}
        ]
      }
    };
    // const payload = {
    //   sorts: [{ property: this.dateProp, direction: "descending" }],
    //   filter: {
    //     and : [
    //       { property: this.dateProp, date: { is_not_empty: true, } },
    //       {
    //         and: [
    //           { property: this.dateProp, date: { after: afterThisDate } },
    //           { property: this.dateProp, date: { before: beforeThisDate } }
    //         ]
    //       }
    //     ]
    //   }
    // };
    const json = this.postNotion("/databases/" + this.notionDbId + "/query", payload);
    return json;
  };

  //Retrieve a specific notion page (return json or false)
  fetchNotionByTaskId(taskId){
    //Filter: "date is not null" && "date is within this.daysForSearch before/after".
    const payload = {
      filter: {
        property:this.taskIdProp, rich_text: { equals: taskId } 
      }
    };
    const json = this.postNotion("/databases/" + this.notionDbId + "/query", payload);
    // Logger.log("json")
    return json.results[0];
  };

  // Match the Google todo deadline to the notion deadline (as long as only the date is correct).
  checkDueNotionPriority(props, task){
    const notionDueStr = this.infoTask.getDueStr(props[this.dateProp].date.start);
    // Logger.log(this.infoTask.getDueStrToday());
    const taskDueStr = this.formatDate(task.due);
    if(!this.isSameDate(notionDueStr, taskDueStr) ){
      this.infoTask.setDue(task, notionDueStr)
      if (this.isLogging) console.log("update due : " + props[this.nameProp].title[0].plain_text);
    }else{
      if (this.isLogging) console.log("skip checkDue task : " + props[this.nameProp].title[0].plain_text);
    }
  };

  //Match notion deadlines to Google todo deadlines (as long as only the date is correct).
  checkDueGoogleTaskPriority(props, task, pageId){
    const notionDueStr = this.infoTask.getDueStr(props[this.dateProp].date.start);
    // Logger.log(googleTaskDueStr);
    const dueStr = this.formatDate(task.due);
    if(!this.isSameDate(notionDueStr, dueStr) ){
      this.sendDueToNotion(dueStr,pageId)
      if (this.isLogging) console.log("update due : " + task.title);
    }else{
      if (this.isLogging) console.log("skip checkDue task : " + task.title);
    }
  };

  // find taskId and corresponding notion (return json or false)
  checkNotionTaskId(taskId){
    const notionExists = this.fetchNotionByTaskId(taskId);
    if(notionExists){//There is a corresponding notion page.
      return notionExists;
    }else{//　No applicable notion page
      return false;
    };
  };

  //Verify if the Notion url is correctly listed in the Notes of Google tasks (without return).
  //Execute until the task notes is filled in.
  checkTaskNotesNotionUrl(googleTask,notionPageUrl){
    if(googleTask.notes){//notes is not blank (not undefined)
      if(!googleTask.notes.includes(notionPageUrl)){//The notionPageUrl is not included in the string of notes
      // Logger.log(googleTask.notes)
        const formerText = this.taskNotesEmptyCheck(googleTask.notes)
        const task = this.infoTask.getTask(googleTask.id);
        if(!formerText){//Make the notes more compact and write the notion url.
          this.infoTask.setNotes(task,notionPageUrl)//Fill in tasks notes
          if (this.isLogging) console.log("Update new notes :" + notionPageUrl);
        }else{//Append notion url to already existing text
          this.infoTask.setNotes(task,formerText + notionPageUrl);//Added to tasks notes
          if (this.isLogging) console.log("Add notes :" + formerText + notionPageUrl);
        };
      };
    }else{//Notes is blank (undefined) 
      const task = this.infoTask.getTask(googleTask.id);
      this.infoTask.setNotes(task,notionPageUrl)//Fill in tasks notes
      if (this.isLogging) console.log("Fill in the url in the blank NOTES :" + notionPageUrl);
    };

  };



  // Check the completion status of Google task and Notion (without return)
  checkStatusGoogleTaskPriority(props,task,pageId){
    const notionCheckbox = props[this.doneStatusProp].checkbox;
    if(!this.compareStatus(props,task)){//Checks if status matches (true if it matches)
      this.sendTaskStatusToNotion(task,pageId);

      let completedStr = "completed";
      let completedStrNegative = "not completed";
      if(!notionCheckbox){
        completedStr = "not completed";
        completedStrNegative = "completed";
        };
      let taskStatusStr = 'completed';
      if(!task.completedBoolean){taskStatusStr = 'not completed'};//false => not completed
      // if(task.status == 'needsAction'){taskStatusStr = 'needsAction'};
      if (this.isLogging) console.log(
            "check complete task (Google task Priority) : " + props[this.nameProp].title[0].plain_text
            + "\n Notion task status : " + completedStr
            + "\n Google task status : " + taskStatusStr
            + "\n ===> SET notion task status : "+ completedStrNegative
          );
    }
  };

  //Determine if the completion status of Google task and notion match (return true or false)
  compareStatus(props,task){
    const notionCheckbox = props[this.doneStatusProp].checkbox;//If true, complete
    if(notionCheckbox == true && task.completedBoolean == true ){//Match ( completed )
      return true;
    }else if(notionCheckbox == false && task.completedBoolean == false){//Match (incomplete)
      return true;
    }else{//No match.
      return false;
    };
  };

  //Check if Googletask title matches notion title
  //If there is no match, unify with Google task title
  checkTitleGoogleTaskPriority(props, task,pageId){
    const googleTaskTitle = task.title;
    const notionPageTitle = props[this.nameProp].title[0].plain_text;
    if(googleTaskTitle != notionPageTitle){//title name does not match=>google title is preferred
      this.sendTaskTitleToNotion(task,pageId);
      if (this.isLogging) console.log("Update notion title to 「" + task.title +"」");
    }else{
      if (this.isLogging) console.log("skip checkTitle task : " + task.title);
    };
  };

  // Compare the contents of Google notes with the contents of notion's notes and give priority to google notes.
  checkNotesGoogleTaskPriority(props, task,pageId){
    const notionPage = this.checkNotionTaskId(task.id);// find taskId and corresponding notion (return json or false)
    const notionNotes =this.getRichText(props[this.notesProp]);
    let textWithoutUrl = this.extractText(task,notionPage.url);

    if(notionNotes != textWithoutUrl){
      const newNotionNotes = textWithoutUrl;
      this.sendTaskNotesToNotion(task,pageId,newNotionNotes);//update notion notes
      if (this.isLogging){
        if(textWithoutUrl && .includes("\n")){
          textWithoutUrl = textWithoutUrl.replace(/\n/,"");//Remove the first line break.
        };
        console.log(
        "Update Google task notes as Google notes " 
        + "\n before : " + notionNotes
        + "\n after  : " + textWithoutUrl );
      };
    }else{
      if (this.isLogging) console.log("skip checkNotes task : " + task.title);
    };
  };

  //Check if the title of the notion matches the title of the Google task
  //If no match, unify with notion title
  checkTitleNotionPriority(props, task){
    const googleTaskTitle = task.title;
    const notionPageTitle = props[this.nameProp].title[0].plain_text;
    if(googleTaskTitle != notionPageTitle){//title name does not match=>notion title is preferred
      this.infoTask.setTitle(task,notionPageTitle);//execution
      if (this.isLogging) console.log("Update Google task title to 「" + notionPageTitle +"」");
    }else{
      if (this.isLogging) console.log("skip checkTitle task : " + task.title);
    };
  };

  // Compare the contents of Google notes with the contents of notion's notes and give priority to notion.
  checkNotesNotionPriority(props, task){
    const notionPage = this.checkNotionTaskId(task.id);// find taskId and corresponding notion (return json or false)
    const notionNotes =this.getRichText(props[this.notesProp]);
    let textWithoutUrl = this.extractText(task,notionPage.url);

    if(notionNotes != textWithoutUrl){
      const newNotes = notionNotes + "\n" + notionPage.url;
      this.infoTask.setNotes(task,newNotes);//Update google notes
      if (this.isLogging){
        if(textWithoutUrl && textWithoutUrl.includes("\n")){
          textWithoutUrl = textWithoutUrl.replace(/\n/,"");//Remove the first line break.
        };
        console.log(
        "Update Google task notes as Notion notes " 
        + "\n before : " + textWithoutUrl
        + "\n after  : " + notionNotes );
      };
    }else{
      if (this.isLogging) console.log("skip checkNotes task : " + task.title);
    };
    
  };

  // Separate the contents of google tasks' notes into pageUrl and text.
  // Extract only the url portion from the text and return
  extractText(task, exclusionWords){
    if(task.notes){//Notes is not blank.
      if(task.notes.includes(exclusionWords)){//Include notionPageUrl in notes
        const regExp = new RegExp(exclusionWords,"g")//https://lab.syncer.jp/Web/JavaScript/Snippet/4/
        const textWithoutExclusionWords = task.notes.replace(regExp,"");
        return textWithoutExclusionWords;
      }
    }else{//notes is blank=>return ""
      return "";
    };
  };


  // Check if there is a string in the task's NOTES return ( string or false)
  taskNotesEmptyCheck(text){
    if(text){//There is already a string in NOTES
        if(!text.includes("https://www.notion.so/")){//Different notion url not included
        //======>notion url notational distortion support (remove "notes" to replace with the latest url)
        //notes has string => add notion url at the bottom
          return text + '\n'
        };
    }else{
      return false;//blank 
    };
  };


  notionTaskManager(notionPage) {
    const props = notionPage.properties;//Columns of notation
    const pageId = notionPage.id.replace(/\-/g, "");//Remove hyphen
    if (this.isLogging) console.log("↓↓↓↓↓ START : notion process " + props[this.nameProp].title[0].plain_text + "  *****");//Display task name in log

    let task = this.getTask(props);
    const notionCheckbox = props[this.doneStatusProp].checkbox;
    // Logger.log(taskIdOfNotion)
    if(!task){//For tasks not yet registered in Google todo
      if(!notionCheckbox){//Exclude taskId unregistered and uncompleted tasks (pattern Y)

        //Create a new task in Google task
        task = this.createTask(props, pageId);

        if (this.isLogging) console.log("create new task : " + props[this.nameProp].title[0].plain_text);
      }else{
        if (this.isLogging) console.log(
            "SKIP task : " + props[this.nameProp].title[0].plain_text
            + "\n !! Nothing to match on Google task (no taskId on notion)!!"
            + "\n Notion task status : completed"
            + "\n Google task status : completed"
          );
      };
    }else{// For tasks already registered in Google todo
      
      //!!! Check date
      this.checkDueNotionPriority(props, task);//Deadline Comparison (Process Y)

      //!!! Check the task name change.
      this.checkTitleNotionPriority(props, task);//Task Name Comparison (Process W)

      //!!! Check Google todo notes
      this.checkNotesNotionPriority(props, task);//Notes Comparison (Process U)

      if(notionCheckbox){//Notion completed task (pattern S)
        if(task.status == 'needsAction'){//Google task not completed

        
          this.infoTask.setCompleted(task, true);//Google task => Complete (Process A)

          if (this.isLogging) console.log(
            "check complete task (Notion Priority) : " + props[this.nameProp].title[0].plain_text
            + "\n Notion task status : completed"
            + "\n Google task status : not completed"
            + "\n ===> SET Google task status : completed"
            );
          // Logger.log("Pattern S Processing");
        }else{
          if (this.isLogging) console.log(
            "SKIP complete task : " + props[this.nameProp].title[0].plain_text
            + "\n Notion task status : completed"
            + "\n Google task status : completed"
            );
        };
      } else{//notion Unfinished task (pattern T)
        if(task.status == 'completed'){//Google task completed

        
          this.infoTask.setCompleted(task, false);//Google task => Not completed (process B)

          if (this.isLogging) console.log(
            "check complete task (Notion Priority) : " + props[this.nameProp].title[0].plain_text
            + "\n Notion task status : not completed"
            + "\n Google task status : completed"
            + "\n ===> SET Google task status : not completed"
            );
          // Logger.log("pattern T processing");
        }else{
          if (this.isLogging) console.log(
            "SKIP complete task : " + props[this.nameProp].title[0].plain_text
            + "\n Notion task status : not completed"
            + "\n Google task status : not completed"
            );
        };
      };
    };
    if (this.isLogging) console.log("↑↑↑↑↑ FINISH: notion process: " + props[this.nameProp].title[0].plain_text + " *****");
  };

  googleTaskManager(task){
    // Logger.log(task.id);
    const checkNotionTaskId = this.checkNotionTaskId(task.id);
    if (this.isLogging) console.log("↓↓↓↓↓ START : google task process: " + task.title + "  *****");//Display task name in log
    
    if(checkNotionTaskId){//There is a corresponding notion page.
      const  notionPage = checkNotionTaskId;//Return json
      const pageId = notionPage.id.replace(/\-/g, "");//Remove hyphen
      const props = notionPage.properties;
      // const notionCheckbox = props[this.doneStatusProp].checkbox;

      //Check notion url in google tasks
      this.checkTaskNotesNotionUrl(task,notionPage.url);

      // !!! Check for changes in NOTES
      this.checkNotesGoogleTaskPriority(props, task,pageId);//(Process V)

      // !!! Check the task name change.
      this.checkTitleGoogleTaskPriority(props, task,pageId);//(Process X)

      // !!! Check for date changes
      this.checkDueGoogleTaskPriority(props, task,pageId)//(Process Z)

      // !!!Check completion status (google status has priority)
      this.checkStatusGoogleTaskPriority(props,task,pageId);//(Process C・D)

      // Logger.log(json);
    }else{//No applicable notion page (Pattern F)
      // !!!Create a new notion page
      this.createNotionPage(task);


    }
    if (this.isLogging) console.log("↑↑↑↑↑ FINISH : google task process " + task.title + "  *****");//Display task name in log
  };
}






