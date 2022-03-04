# Notion2GoogleToDo
Sample programs that interoperate between Notion and Google ToDo (Google Tasks).

## Requirements
- Notion page
- Google account
- Google Apps Script

## How to use?
1. Import all files(notion.gs, googleTasks.gs, main.gs) into your Google apps script (GAS) project.
2. Set parameters of ```initUserProperties()``` in main.gs
3. Set GAS(Google apps script) trigger of ```GoogleTaskToNotion()``` and ```NotionToGoogleTask()```

### Parameters
|  Name  |  Type  | Example | Explanation |
| ---- | ---- | ---- | ---- |
|  notionToken  |  string  | "secret_oxoxoxox" | Notion token |
|  notionDbId  |  string  | "0305a36b11c04727b321171e152e85b5" | Notion database ID(Ex:Relation of DbId and notion page url https://www.notion.so/0305a36b11c04727b321171e152e85b5?v=3bbaab8907704661a3a32be257be74c4)|
|  taskListId  |  string  | "KWssdfnntDt3JKJNgfdoxoxoxox" | Google task list ID |
|  calendarId  |  string  | "oxoxoxox@gmail.com" | Google Calendar ID |
|  nameProp  |  string  | "Title" | Notion database task 'title' column name |
|  dateProp  |  string  | "Date" | Notion database 'task due' column name |
|  taskIdProp  |  string  | "taskId" | Notion database  'Google task ID' column name |
|  doneStatusProp  |  string  | "Done" | Notion database 'Commpleted status' column name |
|  notesProp  |  string  | "Google tasks notes" | Notion database 'Google tasks notes' column name |
|  daysForSearch  |  int  | 31 | How many days to look for deadlines from today. |
|  isLogging  |  Boolean  | true | Whether to keep a log or not |
|  staySecond  |  int  | 0 | Wait second when API request |
|  notionVersion |  string  | "2021-08-16" | Version of notion API |
|  notionLastUpdatePeriod |  int  | 15 | Extract only Notion tasks updated x minutes ago |
|  googleLastUpdatePeriod  |  int | 1000 | Extract only Google tasks updated x secondes ago |

## Notion template
- Template of notion database for this program.

https://storm-headlight-d0a.notion.site/0305a36b11c04727b321171e152e85b5?v=3bbaab8907704661a3a32be257be74c4

# License
Copyright (c) 2022 Namiki Sakakura
This software is released under the MIT License, see LICENSE, see LICENSE.
