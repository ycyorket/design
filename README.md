# design
SDK需要在web工程化项目中使用。将SDK文件夹report放入node_modules中，并在package.json的依赖项（dependencies）中加入”report”: "^1.0.0"这一行。
使用 import report from 'report'; 语句进行引入，调用report方法即可传送数据。
服务器本地开启，在server文件夹下先命令行执行npm install，再执行npm start。在自己默认的账号root、密码password情况下，在mysql中输入web/init.sql中的mysql语句以完成数据库的初始化。
网站本地开启，在web文件夹下先命令行执行npm install，再执行npm run serve。
