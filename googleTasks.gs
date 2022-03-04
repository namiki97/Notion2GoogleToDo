class InfoTask{
  constructor() {
    this.taskListId = PropertiesService.getUserProperties().getProperty('taskListId'),
    this.googleLastUpdatePeriod = PropertiesService.getUserProperties().getProperty('googleLastUpdatePeriod'),
    this.daysForSearch = PropertiesService.getUserProperties().getProperty('daysForSearch')
    this.isLogging = PropertiesService.getUserProperties().getProperty('isLogging')
  }

  // Specify new task
  //Due values are RFC3339 timestamps, not Date objects, etc.
  //example: 2012-06-23T06:01:38.000Z
  addTask(title,notes,dueStr) {
    const task = {
      title: title,
      notes:notes,
      due: dueStr
    };
    const newTask = Tasks.Tasks.insert(task,this.taskListId);
    return newTask
  };

  // Retrieve all task lists associated with the account
  getTaskLists() {
    const taskLists = Tasks.Tasklists.list().getItems();
    if (!taskLists) {
      return [];
    }
    return taskLists.map(function(taskList) {
      return {
        id: taskList.getId(),
        name: taskList.getTitle()
      };
    });
  };

  //Get all tasks in the task list of this.taskListId
  getTasks(){
    const tasks = Tasks.Tasks.list(
      this.taskListId,
      {
        showCompleted: true,// showHidden: set to true to query past tasks that have been completed
        showHidden: true
      }
    ).getItems();//Get task
    if (!tasks) {
      return [];
    }
    return tasks.map(function(task) {
      return {
        id : task.getId(),
        title : task.getTitle(),
        due : task.getDue(),
        notes : task.getNotes(),
        completedOriginal : task.getCompleted(),
        completedBoolean : Boolean(task.getCompleted()),
        completedDue : task.getCompleted()
      };
    }).filter(function(task) {
      return task.title;//Extract only titled (true) tasks
    });
  };

  //Add the date by the amount of the value.
  addDate(date, value) {
    return new Date(date.setDate(date.getDate() + value));
  };

  //Add the date by the amount of the value.
  addMinute(date, value) {
    return new Date(date.setMinutes(date.getMinutes() + value));
  };

  //Add seconds for value
  addSecond(date, value) {
    return new Date(date.setSeconds(date.getSeconds() + value));
  };

  //Get tasks updated within Fat days && Fat seconds
  //return json or false
  getUpdatedTasks(){
    const updatedTime = Utilities.formatDate(
      this.addSecond(new Date(), this.googleLastUpdatePeriod * -1),
      "JST", 
      "yyyy-MM-dd'T'HH:mm:ssXXX"
    );
    const tasks = Tasks.Tasks.list(
      this.taskListId,
      {
        showCompleted: true,// showHidden: set to true to query past tasks that have been completed
        showHidden: true,
        updatedMin:updatedTime,//Query tasks that have been updated within this.googleLastUpdatePeriod seconds
      }
    ).getItems();

    if(tasks){//If the corresponding task exists
      const afterThisDate = Utilities.formatDate(
      this.addDate(new Date(), this.daysForSearch * -1), "JST", "yyyy-MM-dd"
      ) + "T00:00:00.000Z";
      const beforeThisDate = Utilities.formatDate(
      this.addDate(new Date(), this.daysForSearch * 1), "JST", "yyyy-MM-dd"
      ) + "T00:00:00.000Z";
      // Logger.log("afterThisDate: " + afterThisDate);
      // Logger.log("beforeThisDate: " +beforeThisDate);
      return tasks.map(function(task) {
        return {
          id : task.getId(),
          title : task.getTitle(),
          due : task.getDue(),
          notes : task.getNotes(),
          completedOriginal : task.getCompleted(),
          completedBoolean : Boolean(task.getCompleted()),
          completedDue : task.getCompleted(),
          status : task.getStatus(),
          hidden : task.getHidden()
        };
      }).filter(function(task) {
        return task.title && task.due && task.due >= afterThisDate && task.due <= beforeThisDate;


      });
    }else{//If the corresponding task does not exist
      if (this.isLogging) console.log("No updated google tasks within "+this.googleLastUpdatePeriod+"seconds");
      return false;
    };
    
  };

  //Get the specified task
  //return false if there is no corresponding task
  //return json if applicable
  getTask(taskId){
    // const task = Tasks.Tasks.get(this.taskListId,taskId);
    // return task;
    if(taskId == ""){//Forced false when task id is null
      // Logger.log("no task 1")
      return false;
    }else{
      try{
        const task = Tasks.Tasks.get(this.taskListId,taskId);
        return task;
      }catch(e){
        return false;
      };
    };
    
  };

  //Change the completed/uncompleted status of the specified task
  //completed: completed == true, uncompleted: completed == false
  setCompleted(task, completed){
    if(completed){
      task.status = 'completed';//completed
      Tasks.Tasks.update(task, this.taskListId, task.id)
    } else {
      task.status = 'needsAction';//not completed
      Tasks.Tasks.update(task, this.taskListId, task.id)
    }
  };

  //Updates the notes of the specified task.
  setNotes(task,text){
    task.notes = text;
    Tasks.Tasks.update(task, this.taskListId, task.notes)
  };

  //Updates the title of the specified task.
  setTitle(task,title){
    task.title = title;
    Tasks.Tasks.update(task, this.taskListId, task.title)
  };

  // Change the date of the specified task
  setDue(task, newDueStr) {
    // Logger.log(task.due)
    task.due = newDueStr;
    Tasks.Tasks.update(task, this.taskListId, task.id)
  };

  // Function to get a timestamp of a given date in ISO 8601 format
  getDueStr(date){
    const newDate = new Date(date);
    const dueStr = Utilities.formatDate(newDate, "Asia/Tokyo", "yyyy-MM-dd");
    return dueStr + "T00:00:00.000Z";
  };


  // Function to get a timestamp of the day of execution in ISO 8601 format
  getDueStrToday(){
    const today = new Date();
    const dueStr = Utilities.formatDate(today, "Asia/Tokyo", "yyyy-MM-dd");
    return dueStr + "T00:00:00.000Z";
  };

  //Delete a task
  remove(taskId){
    Tasks.Tasks.remove(this.taskListId, taskId);
  };
}









