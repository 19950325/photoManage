//Canvas构造函数,传入html内canvas元素的id(必选),导入按钮id，导出按钮id，上传，裁剪等按钮id（可选，若不填补充为默认值）
function Canvas(canvasId,leadInId,leadOutId) {

	this.canvas=document.getElementById(canvasId);
	this.ctx=this.canvas.getContext("2d");
	this.sPoint={
		x:null,
		y:null,
		drag:false
	};
	this.ePoint={
		x:null,
		y:null
	};//开始坐标点和结束坐标点
	this.rgb={
		r:null,
		g:null,
		b:null
	};
	
	if(!leadInId) this.leadInId="leadIn";
		else this.leadInId=leadInId;
	if(!leadOutId) this.leadOutId="leadOut";
		else this.leadOutId=leadOutId;
	if(!this.leadOutImg) {
		this.leadOutImg=new Image();//导出时应用的画布图片
	    this.leadOutImg.setAttribute('crossOrigin','anonymous');//设置可跨域属性
	}
	if(!this.preview) {
		this.preview=new Image();//对象内预存的画布图片，每次操作完毕更新
		this.preview.setAttribute('crossOrigin','anonymous');//设置可跨域属性
	}

}

Canvas.prototype={
	constructor:Canvas,

	/*imgDbclick函数，添加双击事件到用户图片*/
	imgDblclick:function  (self,id) {
			//给图片添加双击事件，双击时导入画布
			$("#"+id+" img").on("dblclick",function  (e) {
				//重设预存图片
				self.preview.src=e.target.src;

				var sHeight=self.preview.height,sWidth=self.preview.width,
					height=self.canvas.height,width=sWidth/sHeight*height;

				//清空画布
				self.ctx.clearRect(0,0,self.canvas.width,self.canvas.height);
				self.canvas.width=self.canvas.width;

				//图片画到画布
				self.ctx.drawImage(self.preview,0, 0,sWidth,sHeight,
				self.canvas.width/2-width/2,self.canvas.height/2-height/2,width,height);
			});
	},


	/*leadin函数，当导入图片时调用*/
	leadIn:function(self,e) {

		var fr=new FileReader();

		var file = e.target.files[0];

	    // 选择的文件不是图片，报错并返回,是图片时，进行接下来的后续操作
	    if(file.type.substr(0,5)!="image") {
	    	alert("传入图片好伐?");
	    	return false;
	    }

	    //读取图片
	    fr.readAsDataURL(file);

		fr.onload = function(e) {

			//设置图片来源
			self.preview.src = e.target.result;

			//若图片尺寸过大，按比例压缩图片
			var maxWidth=self.canvas.width,
				maxHeight=self.canvas.height,
				previewWidth=self.preview.width,
				previewHeight=self.preview.height;
			if(previewWidth>maxWidth||previewHeight>maxHeight){
				if(previewWidth/previewHeight>maxWidth/maxHeight){
					self.preview.width=maxWidth;
					self.preview.height=Math.round(maxWidth/maxHeight*previewWidth);
				}else{
					self.preview.height=maxHeight;
					self.preview.width=Math.round(maxWidth/maxHeight*previewHeight);
				}
			}
			
		};

		//每次导入前清空画板，再把图片绘制到canvas上，在重设预存图片
		self.preview.onload=function(){
			if(self.preview.src != self.canvas.toDataURL("image/jpg")){
				var sHeight=self.preview.height,sWidth=self.preview.width,
				height=self.canvas.height,width=sWidth/sHeight*height;
				self.ctx.clearRect(0,0,self.canvas.width,self.canvas.height);
				self.canvas.width=self.canvas.width;
				self.ctx.drawImage(self.preview,0, 0,sWidth,sHeight,
									self.canvas.width/2-width/2,self.canvas.height/2-height/2,width,height);
				//重设预存图片
				self.preview.src = self.canvas.toDataURL("image/jpg");
			}
		};
	},

	/*leadOut函数，导出图片时调用*/
	leadOut : function  (self) {
		//图片加载完成时获取url
	    if(self.leadOutImg.complete)   var imgData=self.canvas.toDataURL("image/jpg"); 
	    //设置图像src为获取到的canvas的url
	    self.leadOutImg.src=imgData;

	    var saveLink=document.createElement("a");
	    saveLink.href=self.leadOutImg.src;
	    saveLink.download="图片.jpg";

	    saveLink.click(); 
	},

	/*upload函数，用于上传画布图片至服务器*/
	upload:function  (self) {

		var dataurl=self.canvas.toDataURL("image/jpg");//获取dataurl
	
		var fd=new FormData();
		fd.append('account',sessionStorage.getItem('account'));
		fd.append('password',sessionStorage.getItem('password'));//将账号密码放入名为fd的formdata对象
		fd.append('dataurl',dataurl);//将dataurl base64数据放入名为fd的formdata对象
		
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

	},


	/*addclip函数，按钮点击添加裁剪功能时调用*/
	addClip : function  (self) {
		//如果存在其他已经激活的按钮，则不再激活该按钮
		if($(".active").attr("id")){
			if(($(".active").attr("id"))!=="cut") return false;
		}

		//当canvas画板被按下时,设置spoint的坐标和开始选取状态，并绑定mousemove事件
		function mousedown(self,e){
			self.sPoint.x=e.offsetX?e.offsetX:e.originalEvent.layerX ;
			self.sPoint.y=e.offsetY?e.offsetY:e.originalEvent.layerY;
			self.sPoint.drag=true;

			$("#canvas").on("mousemove",function  (event) {
				mousemove(self,event);
			});
			$("#canvas").on("mouseup",function  (event) {
				mouseup(self,event);
			});

		}

		//当canvas画板按下后鼠标移动时
		function mousemove(self,e){
			//当spoint的开始选取状态是激活的时才可调用函数
			if(self.sPoint.drag==true){
				var ePoint={
					x:e.offsetX?e.offsetX:e.originalEvent.layerX ,
					y:e.offsetY?e.offsetY:e.originalEvent.layerY,
				}

				self.ctx.save();
				self.ctx.clearRect(0, 0, self.canvas.width, self.canvas.height);//画布全清

				self.ctx.drawImage(self.preview,0,0,self.canvas.width,self.canvas.height);//重新绘制底图
				self.ctx.save();
				self.ctx.fillStyle = 'rgba(0, 0, 0, 0.3)';
				self.ctx.fillRect(0, 0, self.canvas.width, self.canvas.height);//重绘阴影
				self.ctx.restore();

				self.ctx.clearRect(self.sPoint.x,self.sPoint.y,ePoint.x-self.sPoint.x,ePoint.y-self.sPoint.y);
				self.ctx.beginPath();
				self.ctx.rect(self.sPoint.x,self.sPoint.y,ePoint.x-self.sPoint.x,ePoint.y-self.sPoint.y);
				//设置路径为选取框
				self.ctx.clip();
				self.ctx.drawImage(self.preview,0,0,self.canvas.width,self.canvas.height);
				self.ctx.restore();


			}
		}

		//当canvas画板松开时
		function mouseup(self,event){
			//如果松开时按的是左键，则取消绑定mousemove事件，并保存结束坐标点
			//如果松开时按的是右键，则坐标清空，重绘画板
			if(event.button===0){
				$("#canvas").off("mousemove mouseup");
				self.sPoint.drag=false;
				self.ePoint.x=event.offsetX;
				self.ePoint.y=event.offsetY;
			}else if(event.button===2){
				$("#canvas").off("mousemove mouseup");
				self.sPoint.x=null;
				self.sPoint.y=null;
				self.ePoint.x=null;
				self.ePoint.y=null;
				self.ctx.drawImage(self.preview,0,0,self.canvas.width,self.canvas.height);
			}
		}

		//根据裁剪按钮状况切换其类为是否激活，绑定或解绑鼠标事件
		if(!$("#cut").hasClass("active")){

			$("#cut").toggleClass("active");

			$("#canvas").on("mousedown",function  (event) {
				mousedown(self,event);
			});

		}else{//若激活，则切换为未激活，解绑所有鼠标事件
			
			//解绑所有鼠标事件
			$("#canvas").off("mousedown");

			//切换类为未激活
			$("#cut").toggleClass("active");
			
			//若有对画布过操作，重置裁剪开始和结束坐标，将裁剪区域绘制到画布
			if(self.sPoint.x&&self.ePoint.x){

				//裁剪区坐标
				var sx=self.sPoint.x,sy=self.sPoint.y,ex=self.ePoint.x,ey=self.ePoint.y,
					cWidth=self.canvas.width,cHeight=self.canvas.height,
					height=cHeight,width=height/(ey-sy)*(ex-sx);

				width=(width>cWidth)?cWidth:height/(ey-sy)*(ex-sx);

				//重置裁剪开始和结束坐标
				self.sPoint.x=null,self.sPoint.y=null,self.ePoint.x=null,self.ePoint.y=null;

				//清空画布,把提取出来的图片信息放进canvas中
				self.ctx.clearRect(0,0,cWidth,cHeight);
				//将图片绘制到画板的一部分（根据截取部分大小）
				self.ctx.drawImage(self.preview,sx,sy,ex-sx,ey-sy,
								   cWidth/2-width/2,0,width,height);//将图片绘制到画板中心
				//更新预存画布图片
				self.preview.src=self.canvas.toDataURL("image/jpg");
			}
		}
	},

	/*addDoodle事件，按钮点击添加涂鸦功能时调用*/
	addDoodle: function (self) {
		//如果存在其他已经激活的按钮，则不再激活该按钮
		if($(".active").attr("id")){
			if(($(".active").attr("id"))!=="doodle") return false;
		}

		//如果涂鸦按钮未激活
		if(!$("#doodle").hasClass("active")) {
			$("#doodle").toggleClass("active");
			$(self.canvas).on("mousedown",function(e){
				var x = Math.floor(e.offsetX?e.offsetX:e.originalEvent.layerX);
				var y = Math.floor(e.offsetY?e.offsetY:e.originalEvent.layerY);

				//保存画笔设定，设置画笔样式，开始绘画
				self.ctx.save();
				self.ctx.fillStyle="black";
				self.ctx.beginPath();
				self.ctx.moveTo(x,y);

				//当鼠标在画布内按下后鼠标移动
				$(self.canvas).on("mousemove",function(e){
					var targetX = Math.floor(e.offsetX?e.offsetX:e.originalEvent.layerX);
					var targetY = Math.floor(e.offsetY?e.offsetY:e.originalEvent.layerY);

					self.ctx.lineWidth = 1;
					self.ctx.lineTo(targetX,targetY);
					self.ctx.stroke();
				});
				//当鼠标在画布内按下后鼠标弹起
				$(self.canvas).on("mouseup",function(e){
					//重置画笔样式，更新预存画布图片,解绑事件
					self.ctx.restore();
					self.preview.src=self.canvas.toDataURL("image/jpg");
				    $(self.canvas).off("mousemove mouseup");
				});
			});
		}else{
			//如果涂鸦按钮已经激活
			$("#doodle").toggleClass("active");
			$(self.canvas).off("mousedown");
		}
	},

	/*addRotate函数，旋转图片时调用*/
	addRotate:function  (self) {

		function rotateChange (self) {
			
			var degree=$("#rotate")[0].value,
				cw=self.canvas.width,ch=self.canvas.height,
				pw=self.preview.width,ph=self.preview.height;
			self.ctx.clearRect(0,0,cw,ch);
			self.ctx.save();//保存状态
			self.ctx.translate(cw/2,ch/2);//设置画布上的旋转的中心点
			self.ctx.rotate(degree*Math.PI/180);
			self.ctx.drawImage(self.preview,-cw/2,-ch/2,cw,ch);//把图片绘制在旋转的中心点
			self.ctx.restore();//恢复状态

		}

		//如果存在其他已经激活的按钮，则不再激活该按钮，以下功能均不再执行
		if($(".active").attr("id")){
			if(($(".active").attr("id"))!=="rotateBtn") {
				$(".dropup").toggleClass("open");//让下拉菜单不要打开
				return false;
			}
		}   

		//如果不存在其他已经激活的按钮且该按钮未激活，开启此按钮功能
		if(!$("#rotateBtn").hasClass("active")){

			$("#rotateBtn").toggleClass("active");//激活
			$("#rotate").on("change",function(){
				rotateChange(self);
			});

		}else{

			//如果不存在其他已经激活的按钮且该按钮已激活，关闭此按钮功能，更新预存图像
			$("#rotateBtn").toggleClass("active");//关闭


			$("#rotate").off("change");

			self.preview.src=self.canvas.toDataURL("image/jpg");//更新预存图像
		}
	},

	/*updateRGB函数，更新rgb滑块值时调用*/
	updateRGB:function  (self) {
		var data=self.ctx.getImageData(0,0,self.canvas.width,self.canvas.height).data;//获取整个画布像素数据
		var rSum=0,gSum=0,bSum=0;
		for(var i=0,len=data.length;i<len;i+=4){
			rSum+=data[i];
			gSum+=data[i+1];
			bSum+=data[i+2];
		}

		self.rgb.r=Math.floor(rSum/data.length);
		self.rgb.g=Math.floor(gSum/data.length);
		self.rgb.b=Math.floor(bSum/data.length);

		$("#rVal")[0].value=self.rgb.r;
		$("#gVal")[0].value=self.rgb.g;
		$("#bVal")[0].value=self.rgb.b;
	},


	/*addRGB函数，RGB值改变时调用*/
	addRGB:function  (self) {

		var imgData=self.ctx.getImageData(0,0,self.canvas.width,self.canvas.height);
		var overR=[],overG=[],overB=[];//溢出数组

		

		function rgbChange (self,rgb) {
			var rValChange=$("#rVal")[0].value-self.rgb.r,
				gValChange=$("#gVal")[0].value-self.rgb.g,
				bValChange=$("#bVal")[0].value-self.rgb.b;//rgb改变量
				data=imgData.data;

			//根据rgb改变量修改画布数据
			if(rgb=="r"){
				for(var i=0,len=imgData.data.length;i<len;i+=4){
					overAlgorithm(data,i,rValChange,overR);//利用自定义的溢出算法函数设置rgb值
				}
			}else if(rgb=="g"){
				for(var i=0,len=imgData.data.length;i<len;i+=4){
					overAlgorithm(data,i+1,gValChange,overG);//利用自定义的溢出算法函数设置rgb值
				}
			}else if(rgb=="b"){
				for(var i=0,len=imgData.data.length;i<len;i+=4){
					overAlgorithm(data,i+2,bValChange,overB);//利用自定义的溢出算法函数设置rgb值
				}
			}
			

			imgData.data=data;	
			self.rgb.r=$("#rVal")[0].value;
			self.rgb.g=$("#gVal")[0].value;
			self.rgb.b=$("#bVal")[0].value;//重设rgb

			self.ctx.clearRect(0,0,canvas.width,canvas.height);//清空画布
			self.ctx.putImageData(imgData,0,0,0,0,self.canvas.width,self.canvas.height);

		}

		//如果存在其他已经激活的按钮，则不再激活该按钮，以下功能均不再执行
		if($(".active").attr("id")){

			if(($(".active").attr("id"))!=="rgbBtn") {
				$(".dropup").toggleClass("open");
				return false;//让下拉菜单不要打开
			}

		}   

		//如果不存在其他已经激活的按钮且该按钮未激活，开启此按钮功能
		if(!$("#rgbBtn").hasClass("active")){

			$("#rgbBtn").toggleClass("active");

			$("#rVal").on("change",function  () {
				rgbChange(self,"r");
			});
			$("#gVal").on("change",function  () {
				rgbChange(self,"g");
			});
			$("#bVal").on("change",function  () {
				rgbChange(self,"b");
			});

		}else{

			//如果不存在其他已经激活的按钮且该按钮已激活，关闭此按钮功能
			//更新预存图像，清空对canvas对象rgbvalue值的操作

			$("#rgbBtn").toggleClass("active");

			$("#rVal,#gVal,#bVal").off("change");

			self.rgb.r=self.rgb.g=self.rgb.b=null;
			self.preview.src=self.canvas.toDataURL();
			
		}
	},

	/*filter函数，调用它为各个滤镜按钮绑定事件*/
	filter:function  (self) {
		//灰度滤镜，为按钮绑定该事件点击后使画布呈现灰度效果
		function greyEffect (self) {

			self.ctx.clearRect(0,0,self.canvas.width,self.canvas.height);
			self.ctx.drawImage(self.preview,0,0,self.canvas.width,self.canvas.height);//重置画布

			var imgData=self.ctx.getImageData(0,0,self.canvas.width,self.canvas.height),
				data=imgData.data,r,g,b,grey;

			for(var i=0,len=data.length;i<len;i+=4){
				r = data[i],
	            g = data[i+1],
	            b = data[i+2];
		        grey = 0.3 * r + 0.59 * g + 0.11 * b;
		        data[i+0] = grey;
		        data[i+1] = grey;
		        data[i+2] = grey;
		    }
		    imgData.data=data;
		    self.ctx.putImageData(imgData,0,0,0,0,self.canvas.width,self.canvas.height);

		}


		//镜像滤镜，为按钮绑定该事件点击后使画布呈现镜像效果
		function mirror(self){

			self.ctx.clearRect(0,0,self.canvas.width,self.canvas.height);
			self.ctx.drawImage(self.preview,0,0,self.canvas.width,self.canvas.height);//重置画布
			
			var imgData=self.ctx.getImageData(0,0,self.canvas.width,self.canvas.height);
			var	tempImgData=self.ctx.createImageData(self.canvas.width,self.canvas.height);
			tempImgData.data.set(imgData.data);

			for ( var x = 0; x < tempImgData.width; x++){ // 行     
	            for ( var y = 0; y < tempImgData.height; y++){ // 列

	                var idx = (x + y * tempImgData.width) * 4;                
	                var midx = (((tempImgData.width -1) - x) + y * tempImgData.width) * 4;  
	                
	                imgData.data[midx] = tempImgData.data[idx]; // Red 改变      
	                imgData.data[midx + 1] = tempImgData.data[idx + 1]; // Green 改变     
	                imgData.data[midx + 2] = tempImgData.data[idx + 2]; // Blue 改变  

	            }  	
	        }  

	        
	       /* var data=imgData.data;
			for ( var x = 0; x < tempImgData.width; x++){ // 行     
	            for ( var y = 0; y < tempImgData.height; y++){ // 列

	                var idx = (x + y * tempImgData.width) * 4;                
	                var midx = (((tempImgData.width -1) - x) + y * tempImgData.width) * 4;  
	                
	                data[midx] = imgData.data[idx]; 
	                data[idx] = imgData.data[midx]; // Red 改变  

	                data[midx + 1] = tempImgData.data[idx + 1]; 
	                data[idx + 1] = imgData.data[midx + 1];// Green 改变   

	                data[midx + 2] = tempImgData.data[idx + 2]; 
	               	data[idx + 2] = imgData.data[midx + 2];// Blue 改变  

	            }  	
	        } 
	        imgData.data=data;
	        */

			self.ctx.putImageData(imgData,0,0,0,0,self.canvas.width,self.canvas.height);

		}

		/*素描滤镜，基于tool.js，为按钮绑定该事件点击后使画布呈现浮雕效果*/
		function sketch(self){

			self.ctx.clearRect(0,0,self.canvas.width,self.canvas.height);
			self.ctx.drawImage(self.preview,0,0,self.canvas.width,self.canvas.height);//重置画布

			var imgData=self.ctx.getImageData(0,0,self.canvas.width,self.canvas.height),
				data=sk(imgData,self,15);

			for(var i=0,len=data.length;i<len;i+=4){
				data[i]-=60;
				data[i+1]-=60;
				data[i+2]-=60;
			}

			imgData.data=data;
			self.ctx.putImageData(imgData,0,0,0,0,self.canvas.width,self.canvas.height);

		}

		/*棕褐滤镜，为按钮绑定该事件，点击后使画布呈现棕褐色效果*/
		function sepia(self){

			self.ctx.clearRect(0,0,self.canvas.width,self.canvas.height);
			self.ctx.drawImage(self.preview,0,0,self.canvas.width,self.canvas.height);//重置画布

			var imgData=self.ctx.getImageData(0,0,self.canvas.width,self.canvas.height),
				data=imgData.data;

			for(var i=0,len=data.length;i<len;i+=4){
				data[i] = (data[i]*0.393)+(data[i+1]*0.769)+(data[i+2]*0.189);
			    data[i+1] = (data[i]*0.349)+(data[i+1]*0.686)+(data[i+2]*0.168);
			    data[i+2] = (data[i]*0.272)+(data[i+1]*0.534)+(data[i+2]*0.131);
			}

			imgData.data=data;
			self.ctx.putImageData(imgData,0,0,0,0,self.canvas.width,self.canvas.height);

		}

		 /**
	     * 调节亮度
	     * @param  {Object} self 保存着各个画布相关参数的对象
	     * @param  Boolean x  增加亮度还是降低亮度，true为增加，false为减少
	     * @param  {Number} value 改变亮度的值
	     */
	     function adjustBrightness(self,x,value){
	     	self.ctx.clearRect(0,0,self.canvas.width,self.canvas.height);
			self.ctx.drawImage(self.preview,0,0,self.canvas.width,self.canvas.height);//重置画布

			var imgData=self.ctx.getImageData(0,0,self.canvas.width,self.canvas.height),
				data=imgData.data,overR,overG,overB;
				overR=overG=overB=[];
			
			if(x) value=value?value:0;
				else value=value?-value:0;//根据第二个参数判断是增加还是降低亮度

			
			for(var i=0,len=data.length;i<len;i+=4){
				overAlgorithm(data,i,value,overR);//利用自定义的溢出算法函数设置r值
				overAlgorithm(data,i+1,value,overG);//利用自定义的溢出算法函数设置g值
				overAlgorithm(data,i+2,value,overB);//利用自定义的溢出算法函数设置b值
			}
			
			imgData.data=data;
			self.ctx.putImageData(imgData,0,0,0,0,self.canvas.width,self.canvas.height);

			self.preview.src=self.canvas.toDataURL();//重设预存图片（由于是亮度调节所以要重设并在原基础上改变）
	     }


		//如果存在其他已经激活的按钮，则不再激活该按钮，以下功能均不再执行
		if($(".active").attr("id")){

			if(($(".active").attr("id"))!=="filterBtn") {
				$(".dropup").toggleClass("open");//让下拉菜单不要打开
				return false;
			}

		}  

		if(!$("#filterBtn").hasClass("active")){

			$("#filterBtn").toggleClass("active");

			$("#greyEffect").on("click",function  () {//绑定灰度按钮点击事件
				greyEffect(self);
			});	

			$("#sepia").on("click",function  () {//绑定棕褐按钮点击事件
				sepia(self);
			});

			$("#sketch").on("click",function  () {//绑定素描按钮点击事件
				sketch(self);
			});	

			$("#mirror").on("click",function  () {//绑定镜像按钮点击事件
				mirror(self);
			});	

			$("#brighten").on("click",function  () {//绑定亮度+5按钮点击事件
				adjustBrightness(self,true,5);
			});	

			$("#darken").on("click",function  () {//绑定亮度-5按钮点击事件
				adjustBrightness(self,false,5);
			});	

			

		}else{

			//如果不存在其他已经激活的按钮且该按钮已激活，关闭此按钮功能
			//更新预存图像，清空对canvas对象各个操作
			$("#filterBtn").toggleClass("active");
			$("#greyEffect,#sepia,#sketch,#mirror,#brighten,#darken").off("click");
			self.preview.src=self.canvas.toDataURL();
			
		}
	},






	/*绑定leadIn函数*/
	bindLeadIn:function(){
		var self=this;
		$("#"+this.leadInId).after("<input type='file' id='loadnone' style='display:none'>");
		$("#"+this.leadInId).on("click",function (e) {
			document.getElementById("loadnone").click();
		});

		$("#loadnone").on("change",function(event){
			self.leadIn(self,event);
		});
	},

	/*绑定leadOut函数*/
	bindLeadOut:function(){
		var self=this;
		$("#"+self.leadOutId).on("click",function(){
			self.leadOut(self);
		});
	},

	/*绑定upload函数*/
	bindUpload:function  () {
		var self=this;
		$("#upload").on("click",function  () {
			self.upload(self);
		});
	},
	/*绑定addclip函数*/
	bindAddClip:function(){
		var self=this;
		$("#cut").on("click",function(){
			self.addClip(self);
		});
	},

	/*绑定addDoodle函数*/
	binddoodle:function(){
		var self=this;
		$("#doodle").on("click",function  () {
			self.addDoodle(self);
		});
	},

	/*绑定addRotate旋转函数*/
	bindRotate:function(){
		var self=this;
		$("#rotateBtn").on("click",function  () {
			self.addRotate(self);
		});
	},

	/*绑定addRGB函数*/
	bindAddRGB:function  () {
		var self=this;
		$("#rgbBtn").on("click",function(){
			self.updateRGB(self);//更新rgb滑块值
			self.addRGB(self);//绑定rgb滑块值改变时触发的事件
		});
	},

	/*绑定filter各个滤镜按钮函数*/
	bindFilter:function(){
		var self=this;
		$("#filterBtn").on("click",function  () {
			self.filter(self);
		});
	},

	/*初始化*/
	init:function  () {

		//获取用户以前上传过的图片(tool.js中的函数)，如果未上传过会返回空
		var result=getUsedImg(sessionStorage.getItem('account'));

		var self=this;

		//如果用户曾经上传过照片，将用户曾经上传的图片导入到页面的head容器中(tool.js中的函数),并为图片导入事件
		if(result){
			uploadUsedImg(result,"head");

			this.imgDblclick(self,"head");
		}
		
		//画布初始化
		this.ctx.fillStyle="white";
		this.ctx.fillRect(0,0,this.canvas.width,this.canvas.height);

		//取消浏览器点击鼠标右键自带的菜单栏
		document.addEventListener('contextmenu', function(e) {
	      e.preventDefault();
	      e.stopPropagation();
	    });	

	    //取消下拉菜单点击菜单内区域关闭
	    $(".dropdown-menu:not(:first)").on('click', function (e) {
            e.stopPropagation();
        });
		//绑定各种事件
		this.bindLeadIn();
		this.bindLeadOut();
		this.bindAddClip();
		this.binddoodle();
		this.bindRotate();
		this.bindAddRGB();
		this.bindFilter();
		this.bindUpload();

		

	},

}


