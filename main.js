/**
 * express接收html传递的参数
 */
var  express=require('express');
var  multiparty=require('connect-multiparty');
var  fs = require("fs");
var  mysql=require('mysql');
var  bodyParser = require('body-parser');
var  async=require('async');
var  http=require('http');

var  app=express();
var  multipartyMiddleware=multiparty();

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({extended:false}));


/*设置静态资源池*/
var  server=app.use(express.static("static")).listen(8080,'127.0.0.1',function () {
    console.log("start");
});

/*
    登陆功能

    传入req需要含有如下参数
    user:账号名
    password:密码

    返回res有如下参数
    msg:根据注册成功与否该返回信息不同
    url:根据注册成功与否该url不同，若注册不成功，则不返回url

*/
app.get('/login',function (req,res) {
   
    var user_address=req.query.user;
    var password=req.query.password;

    var connection = mysql.createConnection({
          host: 'localhost',
          user: 'root',
          password: 'asd703090',
          database: 'BiShe',
    });
    
    connection.connect();

    function user (callback) {
        connection.query("SELECT user_address,password FROM Users",function  (err,result,fields) {

            if(err){
                if (err) { 
                    console.log(err);
                    callback('err'); 
                }
            }
            if(result){
                for (var i=0;i<result.length;i++){
                    if(result[i]["user_address"]==user_address&&result[i]["password"]==password) {
                        
                        console.log("用户成功登陆");
                        res.send({msg:"用户成功登陆",url:"http://localhost:8080/user.html"});
                        res.end();
                        
                    }          
                }  
            }
            callback(null);
        }); 
    }
    
    function admin (callback) {
       connection.query("SELECT admin_address,password FROM Admin",function  (err,result,fields) {

            if(err){
                if (err) { 
                    console.log(err);
                    callback('err'); 
                }
            }

            if(result){
                for (var i=0;i<result.length;i++){
                    if(result[i]["admin_address"]==user_address&&result[i]["password"]==password) {
                      
                        console.log("管理员成功登陆");
                        res.send({msg:"管理员成功登陆",url:"http://localhost:8080/administrator.html"});
                        res.end();

                    }        
                }  
            }
            callback(null);
        });
    }
    
    async.waterfall([
        user,
        admin],
        function  (err) {
            res.end(err);
            connection.end();
        });
});


/*
    注册功能
    
    传入req内需要有以下参数

    user，用户账号名 
    password,用户密码

    返回res有如下参数
    msg:根据注册成功与否该返回信息不同
    url:根据注册成功与否该url不同，若注册不成功，则不返回url

*/
app.get('/register',function (req,res) {
    var user_address=req.query.user;
    var password=req.query.password;

    var connection = mysql.createConnection({
          host: 'localhost',
          user: 'root',
          password: 'asd703090',
          database: 'BiShe',
    });
    

    connection.connect();

    function user (callback) {
        connection.query("SELECT user_address,password FROM users",function  (err,result,fields) {
            if(err){
                if (err) { 
                    console.log(err);
                    callback('err'); 
                }
            }
            if(result){
                for (var i=0;i<result.length;i++){
                    if(result[i]["user_address"]==user_address) {
                        console.log("已有该普通用户");
                        res.send({msg:"已有该普通用户"});
                        res.end();
                    }
                }
            }
            callback(null);
        }); 
    }

    function admin (callback) {

        connection.query("SELECT admin_address,password FROM admin",function  (err,result,fields) {
            if(err){
                    console.log(err);
                    callback('err');
            }

            if(result){
                for (var i=0;i<result.length;i++){
                    if(result[i]["admin_address"]==user_address) {
                        console.log("已有该管理员用户");
                        res.send({msg:"已有该管理员用户"});
                        res.end();
                    }
                }
            }   
            callback(null);
        }); 
    }

    function regist (callback) {

        connection.query("INSERT INTO Users (user_address,password) VALUES(?,?)",
            [user_address,password],function  (err,result,fields) {
                if(err){
                    if (err) { 
                        console.log(err);
                        callback('err');
                    }
                }
                fs.mkdirSync("./static/user/"+user_address+' image');
                console.log("注册完成");
                res.send({msg:"注册完成，2秒后自动跳转回登陆页面",url:"http://localhost:8080/index.html"});
                res.end();
                callback(null);
        }); 
    }

    async.waterfall([
        user,
        admin,
        regist
        ],function  (err) {

          connection.end();

    });

});

/*
    获取所有用户名及其下属图片的功能

    传入req需要有以下参数
    account,管理员账号名，必须验证是管理员账号才允许后续操作，否则报警(不是真的报警哈，是输出警告)并且传回错误

    传回res有以下参数
    admin，布尔型数据，为true表示是管理员，为false表示不是
    acc数组，内含所有用户名
    n个用户名命名的对象，response.flb123456={picname:base64url,...}
    (前端通过acc内含的用户名读取各用户数组)

*/
app.get('/admin-getall',function  (req,res) {
    var isAdmin=false,acc=[];
    var connection = mysql.createConnection({
          host: 'localhost',
          user: 'root',
          password: 'asd703090',
          database: 'BiShe',
        });
    var account=req.query.account;
    var response={};//返回的对象

    //若是admin用户，将isAdim变量改为true，否则为false将无法进行后续功能
    function testIsAdmin (callback) {
        console.log("开始检索用户是否是管理员");
        connection.query("SELECT admin_address,password FROM admin",function  (err,result,fields) {
            if(err){
                if (err) { 
                    console.log(err);
                }
            }
            if(result){
                for (var i=0;i<result.length;i++){
                    if(result[i]["admin_address"]==account) {
                        isAdmin=true;
                        console.log("存在该管理员用户");
                        callback(null);
                    }
                }
            }   
        }); 
    }
    
    //如果是admin账号，获取用户名
    function getUserName (callback) {
        if(isAdmin){

            response.admin=true;

            console.log("开始取出各用户名");
            connection.query("SELECT user_address FROM users",function  (err,result,fields) {
                if(err){
                    if (err) { 
                        console.log(err);
                    }
                }

                if(result){
                    for (var i=0;i<result.length;i++){
                        if(result[i]["user_address"]) {
                            acc.push(result[i]["user_address"]);
                        }
                    }
                }

                response.acc=acc;
                console.log("获取用户名完毕");
                callback(null); 

            });
        }else{
            response.admin=false;
        }
    }
    //如果是admin账号，获取用户图片
    function  getImgData(callback) {

        if(isAdmin){
            console.log("开始取出各个用户的图片");
            acc.forEach(function  (userName,index) {

                console.log(userName);

                var path="./static/user/"+userName+' image';
                var temarr=[],result={};

                //读取用户文件夹中的所有文件和文件夹，若为文件，则其名放入result中准备被读取
                var files=fs.readdirSync(path);
                files.forEach(function  (val,index) {//val为图片名
                    var fpath=path+'/'+val;
                    console.log("读取"+fpath+"\n");
                    var stat=fs.statSync(fpath);
                    if(stat.isFile()) temarr.push(val); 
                });

                //读取用户文件夹中的文件（用户文件夹内的文件都是图片）
                //取其图片base64编码，以键值对方式放入result数组
                temarr.forEach(function  (val,index) {//val为图片名
                    var data="data:image/jpg;base64,"+fs.readFileSync(path+'/'+val,'base64');
                    result[val]=data;
                });

                //将该用户的图片文件数据以用户名为属性放入response对象
                response[userName]=result;
            });

            console.log("用户图片读取完毕");
            callback(null); 
        }

    }
    async.waterfall([
        testIsAdmin,
        getUserName,
        getImgData,
        ]
        ,function  (err) {
            res.send(response);
            res.end();
            connection.end();
    });
});



/*
    获取某一用户下的所有图片功能

    传入req内需要有以下参数
    account，用户账号名

    传回res中有以下函数
    result数组，内含n项{图片名：编码}形式的数据

*/
app.get('/getall',function  (req,res) {

    console.log("申请获取"+req.query.account+"的所有图片");
    console.log("申请通过");


    var path='./static/user/'+req.query.account+' image';//用户根目录路径
    var result=[];

    //获取用户文件夹以及子目录下内所有文件名（若其内为文件夹不会再搜寻子文件夹内内容）
    var files=fs.readdirSync(path);
    files.forEach(function  (val,index) {
        var fpath=path+'/'+val;
        console.log(fpath+"\n");
        var stat=fs.statSync(fpath);
        if(stat.isFile()) result.push(val);
    });
    if(!result) {
        res.send(null);
    }else {
        //获取每个图像文件的base64编码并以{图片名：编码}形式保存在result数组的一个个项中
        result.forEach(function  (val,index) {
            var data="data:image/jpg;base64,"+fs.readFileSync(path+'/'+val,'base64');
            result[index]={val:data};
        });
    }

    //返回结果数组
    res.send(result);
    console.log(req.query.account+"的所有图片发送完毕");     
});

/*
    上传图片功能（尚未添加重复图片筛选功能）
    传入req内需要有以下参数

    account，用户账号名 
    dataurl,图片的dataurl base64编码

*/
app.post('/upload',multipartyMiddleware,function  (req,res) {

    console.log("有图片上传");

    var date=new Date().getTime();//获取当前时间


    //若不存在用户目录，先创建
    if(!fs.existsSync('./static/user/'+req.body.account+' image')){
        fs.mkdirSync('./static/user/'+req.body.account+' image');
    }
    
    //接收前台POST过来的base64,过滤data:URL
    var base64Data = req.body.dataurl.replace(/^data:image\/\w+;base64,/, " ");
    var dataBuffer = new Buffer(base64Data,'base64');

    fs.writeFileSync('./static/user/'+req.body.account+' image/'+date+'.jpg',dataBuffer);
    console.log("图片上传完毕，上传的图片为"+date+".jpg");
    res.send("保存成功");

});


/*

    删除图片功能
    传入req内需要有以下参数

    imgname，图片文件名
    account，用户账号名

*/
app.post('/admin-delete',function  (req,res) {
    console.log(req.body);
    console.log(req.body.imgname+".jpg将要被删除");

    fs.unlinkSync('./static/user/'+req.body.account+' image/'+req.body.imgname);

    console.log('图片已被删除');

    res.send('删除成功');

});

/*页面基础跳转至登陆页面*/
app.get('/',function (req,res) {
     res.redirect('/index.html');
});

