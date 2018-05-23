$(function  () {

	var selectedAccount;//全局selectedAccount变量，表示被选中的将删除的img归属于什么用户
	var selectedImgName;//全局selectedImgName变量，表示被选中的将删除的img的name

	

	/*图像被选中时图像边框样式改变*/
	function imgSelected (e) {
		if(selectedImgName){
			//若已经有选中的，将之前选中的样式改回来
			document.getElementsByName(selectedImgName)[0].style.border="1px solid #757575";
		}
		e.target.style.border="2px solid #3a52ec";//修改样式
		selectedImgName=e.target.name;//覆盖selectedImgName被选图片名
		selectedAccount=e.target.parentNode.getAttribute("data-account");//覆盖selectedAccount被选用户名
	}




	/*根据传入的dataurl图像url和account用户名上传图片到服务器*/
	function uploadImg (dataURL,account) {

		var fd=new FormData();
		fd.append('account',account);//将用户名放入名为fd的formdata对象
		fd.append('dataurl',dataURL);//将dataurl base64数据放入名为fd的formdata对象

		$.ajax({
			type:"post",
			url:"http://localhost:8080/upload",
			contentType:false,
			data:fd,
            processData:false,//processData用于对data参数进行序列化处理,为false不对发送数据进行转换


			success:function  (data) {
				alert("图片上传好了");
			},
			error:function  (err) {
				alert("出错了，别问我啥错，反正出错了，自己滚去看代码");
			},
		});
	}


	/*通过input元素选取文件，文件为图片时返回选取图片的url，否则返回false*/
	function getUploadImgUrl (account) {

    	var input=document.createElement("input");
    	input.type='file';
    	input.id='loadnone';
    	input.style='display:none';

    	input.click();
    	$(input).on("change",function  (e) {
    		var fr=new FileReader();
    		var file=e.target.files[0];

    		if(file.type.substr(0,5)!='image'){
    			alert("请选择图片文件啊");
    			return false;
    		}

    		//读取图片
    		fr.readAsDataURL(file);
    		
    		fr.onload=function  (event) {
    			dataURL=event.target.result;
    			
    			//如果图片大于2M，提示过大将压缩图片再上传
	    		if(file.size>2*1024*1024){

	    			alert("图片大小超过2M，将压缩后再上传");

	    			var img = new Image();  
			        img.src = dataURL;  
			        var c = document.createElement("canvas");  
					var ctx = c.getContext("2d");  

			        c.width = 512;  
			        c.height = 1024;  

			        img.onload = function(e){  

			            ctx.drawImage(e.target, 0, 0, c.width, c.height); 

			            dataURL=c.toDataURL("image/jpg");  

			            uploadImg(dataURL,account);
			        }  

	    		}else{

	    			uploadImg(dataURL,account);

	    		}
    			
    		}
    	});

	}


	/*
		传入val值，隐藏掉不符合值的用户表格行
	*/
	function hideUnselectedUser (val) {
		$(".userName").each(function  (index,elem) {

			//初始化用户表格行显示
			elem.parentNode.style=" ";

			//隐藏掉匹配的用户表格行
			var reg=new RegExp("^"+val,"g");
			if(!reg.test(elem.innerHTML)){
				elem.parentNode.style="display:none";
			}

		});
	}

	/*
		初始化，绑定各种事件
	*/
	function  init() {

		$(".img").on("click",function  (e) {
        	imgSelected(e);
        });

		//删除按钮点击时发送ajax删除选中图片
        $(".delete").on("click",function  (e) {
        	$.ajax({
				type:"post",
				url:"http://localhost:8080/admin-delete",
				data:{imgname:selectedImgName,account:selectedAccount},


				success:function  (data) {
					alert("图片删除完毕");
				},
				error:function  (err) {
					alert("出错了，别问我啥错，反正出错了，自己滚去看代码");
				},
			});
        });

        //添加点击时选择系统图片转化为dataurl发送给ajax添加图片
        $(".add").on("click",function  (e) {
        	var account=$(e.target).parent().parent()[0].id;//获取用户id（保存在tr里）
			getUploadImgUrl(account);//获取图片dataurls，获取完后其内部自动调用uploadImg上传图片
        });

        //IE情况下的搜索事件
        $("#search").on("onpropertychange",function  (e) {
        	var val=e.target.value;
        	hideUnselectedUser(val);
        });
        //非IE浏览器下的搜索事件
        $("#search").on("input",function  (e) {
        	var val=e.target.value;
        	hideUnselectedUser(val);
        });
        
        //防止搜索框按回车刷新页面
        $("#search").on("keypress",function  (e) {
        	if(e.keyCode==13||e.keyWhich==13)	return false;
        });

	}

	/**
    * 将指定用户曾经上传的图片导入到页面的xxx处
    * @param  userName 该用户名
    * @param  arr 曾经上传的图片[{图片名：图片base64编码},{图片名：图片base64编码}]形式
    * @param  id 图片导入的页面容器的id
    */
	function adminUploadUsedImg (userName,result) {

		var tbody=$("#tbody")[0];


		var tab=tbody.innerHTML;//动态添加tbody的用户名，图片和操作按钮
		tab+="<tr id='"+userName+"'>";
		tab+="<td class='userName'>"+userName+"</td>";//添加用户名name列
		tab+="<td class='userimgs' data-account='"+userName+"'>"+"</td>";//添加用户图片img列
		tab+="<td class='operator'>"
		tab+="<button class='add'>增加</button>\n<button class='delete'>删除</button>"
		tab+="</td>";//添加操作operator列
        tab+="</tr>";
        tbody.innerHTML=tab;//添加完毕

		//遍历result每个元素取出对象{图片名：图片base64编码}，添加到imgCol列中
		result.forEach(function  (val,index) {
			var key=Object.keys(val)[0];//图片名
        	var url=val[key];//图片base64编码

            var img=document.createElement("img");
            img.name=key;
            img.src=url;
            img.className="img";

            $("#"+userName+" .userimgs")[0].appendChild(img);
        });
	}

	/*
		传回res有以下参数
	    admin，布尔型数据，为true表示是管理员，为false表示不是
	    acc数组，内含所有用户名

	    n个用户名命名的对象，内含其用户内有的n项{图片名：编码}形式的数据,例如data.flb123456={picname:base64url,...}
	    (前端通过acc内含的用户名读取各用户数组)
    */

	$.ajax({
		type:"get",
		url:"http://localhost:8080/admin-getall",
		async:false,//同步ajax，为了使导入各个管理员后再加载网页功能
		contentType:"application/json",
		data:{'account':sessionStorage.getItem('account')},

		success:function  (data) {
			if(data.admin==true){

				alert("各用户资料导入完毕");

				
				var usersName=data.acc;//取出用户名

				usersName.forEach(function (name,index) {

					var userImgData=data[name];//获取该用户所有以数组形式存放的数据
					var imgNameArr=Object.keys(userImgData);
					var result=[];//该用户曾经上传的图片[{图片名：图片base64编码},{图片名：图片base64编码}]形式保存

					imgNameArr.forEach(function (picname,index){
						var obj={};
						obj[picname]=userImgData[picname];//属性名：图片base64编码
						result.push(obj);
					});

					adminUploadUsedImg(name,result);//动态表现该用户的用户名，图片，并外加两个操作按钮

				});

				init();//初始化(给动态添加的东西添加事件)

			}
			else{
				alert("无管理员权限");
			}	
		},
		error:function  (err) {
			alert("妈呀，出错了");
		},
	});

});