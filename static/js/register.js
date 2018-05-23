$(function  () {
	function register(user,password){

		var uPattern=/^[a-zA-Z]\w{3,15}$/ig;//4-16个字符,只能以字母开头,由字母a～z(不区分大小写)
											//、数字0～9、点、减号或下划线组成的用户名
		var pPattern=/^[0-9a-zA-Z!@#$^]{6,18}$/ig;//6-18位由数字、大写字母
												  //、小写字母、特殊字符四种字符中的至少两种字符组成的密码。
		if(!user) {
			alert("请输入用户名");
			return false;
		}

		if(!password){
			alert("请输入密码");
			return false;
		}
		
		if(!uPattern.test(user)){
			alert("请输入长度为4～16个字符，只能以字母开头，由字母a～z(不区分大小写)、数字0～9、点、减号或下划线组成的用户名");
			return false;
		}

		if(!pPattern.test(password)){
			alert("请输入6-18位由数字、大写字母、小写字母、特殊字符四种字符中的至少两种字符组成的密码");
			return false;
		}

		//账号密码都通过规则，进入以下代码
		var info={user:user,password:password};
		$.ajax({
			type:"get",
			url:"http://localhost:8080/register",
			contentType:"application/json",
			data:info,
			dataType:"json",

			success:function  (data) {
				alert(data.msg);
				if(data.url){
					setTimeout(function  () {
						location.href="index.html";
					},3000);
				}
			},

			error:function  (err) {
				alert(err);
			},
		});
	}

	$("#register").on("click",function  () {
		var user=$("#user")[0].value;
		var password=$("#password")[0].value;
		
		register(user,password);
	});

});