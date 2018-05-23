  /**
     * 把图像变成黑白色
     * Y = 0.299R + 0.587G + 0.114B
     * @param  {Array} pixes pix array
     * @return {Array}
     * @link {http://www.61ic.com/Article/DaVinci/DM64X/200804/19645.html}
     */
    function discolor(pixes) {
        var grayscale;
        for (var i = 0, len = pixes.length; i < len; i += 4) {
            grayscale = pixes[i] * 0.299 + pixes[i + 1] * 0.587 + pixes[i + 2] * 0.114;
            pixes[i] = pixes[i + 1] = pixes[i + 2] = grayscale;
        }
        return pixes;
    }

    /**
     * 把图片反相, 即将某个颜色换成它的补色
     * @param  {Array} pixes pix array
     * @return {Array}
     */
    function invert(pixes) {
        for (var i = 0, len = pixes.length; i < len; i += 4) {
            pixes[i] = 255 - pixes[i]; //r
            pixes[i + 1] = 255 - pixes[i + 1]; //g
            pixes[i + 2] = 255 - pixes[i + 2]; //b
        }
        return pixes;
    }
    /**
     * 颜色减淡,
     * 结果色 = 基色 + (混合色 * 基色) / (255 - 混合色)
     * @param  {Array} basePixes 基色
     * @param  {Array} mixPixes  混合色
     * @return {Array}
     */
    function dodgeColor(basePixes, mixPixes) {
        for (var i = 0, len = basePixes.length; i < len; i += 4) {
            basePixes[i] = basePixes[i] + (basePixes[i] * mixPixes[i]) / (255 - mixPixes[i]);
            basePixes[i + 1] = basePixes[i + 1] + (basePixes[i + 1] * mixPixes[i + 1]) / (255 - mixPixes[i + 1]);
            basePixes[i + 2] = basePixes[i + 2] + (basePixes[i + 2] * mixPixes[i + 2]) / (255 - mixPixes[i + 2]);
        }
        return basePixes;
    }

    /**
     * 高斯模糊
     * @param  {Array} pixes  pix array
     * @param  {Number} width 图片的宽度
     * @param  {Number} height 图片的高度
     * @param  {Number} radius 取样区域半径, 正数, 可选, 默认为 3.0
     * @param  {Number} sigma 标准方差, 可选, 默认取值为 radius / 3
     * @return {Array}
     */
    function gaussBlur(pixes, width, height, radius, sigma) {
        var gaussMatrix = [],
            gaussSum = 0,
            x, y,
            r, g, b, a,
            i, j, k, len;

        radius = Math.floor(radius) || 3;
        sigma = sigma || radius / 3;
        
        a = 1 / (Math.sqrt(2 * Math.PI) * sigma);
        b = -1 / (2 * sigma * sigma);
        //生成高斯矩阵
        for (i = 0, x = -radius; x <= radius; x++, i++){
            g = a * Math.exp(b * x * x);
            gaussMatrix[i] = g;
            gaussSum += g;
        
        }
        //归一化, 保证高斯矩阵的值在[0,1]之间
        for (i = 0, len = gaussMatrix.length; i < len; i++) {
            gaussMatrix[i] /= gaussSum;
        }
        //x 方向一维高斯运算
        for (y = 0; y < height; y++) {
            for (x = 0; x < width; x++) {
                r = g = b = a = 0;
                gaussSum = 0;
                for(j = -radius; j <= radius; j++){
                    k = x + j;
                    if(k >= 0 && k < width){//确保 k 没超出 x 的范围
                        //r,g,b,a 四个一组
                        i = (y * width + k) * 4;
                        r += pixes[i] * gaussMatrix[j + radius];
                        g += pixes[i + 1] * gaussMatrix[j + radius];
                        b += pixes[i + 2] * gaussMatrix[j + radius];
                        // a += pixes[i + 3] * gaussMatrix[j];
                        gaussSum += gaussMatrix[j + radius];
                    }
                }
                i = (y * width + x) * 4;
                // 除以 gaussSum 是为了消除处于边缘的像素, 高斯运算不足的问题
                // console.log(gaussSum)
                pixes[i] = r / gaussSum;
                pixes[i + 1] = g / gaussSum;
                pixes[i + 2] = b / gaussSum;
                // pixes[i + 3] = a ;
            }
        }
        //y 方向一维高斯运算
        for (x = 0; x < width; x++) {
            for (y = 0; y < height; y++) {
                r = g = b = a = 0;
                gaussSum = 0;
                for(j = -radius; j <= radius; j++){
                    k = y + j;
                    if(k >= 0 && k < height){//确保 k 没超出 y 的范围
                        i = (k * width + x) * 4;
                        r += pixes[i] * gaussMatrix[j + radius];
                        g += pixes[i + 1] * gaussMatrix[j + radius];
                        b += pixes[i + 2] * gaussMatrix[j + radius];
                        // a += pixes[i + 3] * gaussMatrix[j];
                        gaussSum += gaussMatrix[j + radius];
                    }
                }
                i = (y * width + x) * 4;
                pixes[i] = r / gaussSum;
                pixes[i + 1] = g / gaussSum;
                pixes[i + 2] = b / gaussSum;
                // pixes[i] = r ;
                // pixes[i + 1] = g ;
                // pixes[i + 2] = b ;
                // pixes[i + 3] = a ;
            }
        }
        //end
        return pixes;
    }

    /**
     * 素描
     * @param  {Object} imgData 
     * @param  {Object} self canvas，ctx存放处
     * @param  {Number} radius 取样区域半径, 正数, 可选, 默认为 3.0
     * @param  {Number} sigma 标准方差, 可选, 默认取值为 radius / 3
     * @return {Array}
     */
    function sk(imgData,self, radius, sigma){
        var pixes = imgData.data,
            width = imgData.width, 
            height = imgData.height,
            copyPixes;

        discolor(pixes);//去色
        //复制一份
        self.ctx.clearRect(0, 0, self.canvas.width, self.canvas.height);
        self.ctx.putImageData(imgData, 0, 0,0,0,self.canvas.width, self.canvas.height);
        copyPixes = self.ctx.getImageData(0, 0, self.canvas.width, self.canvas.height).data;
        // 拷贝数组太慢
        // copyPixes = Array.prototype.slice.call(pixes, 0);
        invert(copyPixes);//反相
        gaussBlur(copyPixes, width, height, radius, sigma);//高斯模糊
        dodgeColor(pixes, copyPixes);//颜色减淡
        return pixes;
    }


    /**
    * 溢出算法
    * @param  {Object} imgData
    * @param  {Number} i，索引（rgb值在数组中索引，i/i+1/i+2）
    * @param  {Number} valChange(r或者g或者b的改变值)
    * @param  {Array} overarr(r或者g或者b的改变值溢出数组overR或者overG或者overB，在外预设后导入)
    */
    function overAlgorithm(data,i,valChange,overarr){

        if(data[i]+valChange>=255){//大于255

            if(overarr[i]) overarr[i]+=data[i]+valChange-255;//大于255且以前有溢出过rgb

            else overarr[i]=data[i]+valChange-255;//大于255但以前未溢出过rgb

            data[i]=255;//无论是否溢出过，因为大于255,所以将该数据设置为255

        }else{//小于255
            if(overarr[i]) {//小于255但以前有溢出过rgb
                if((data[i]+valChange+overarr[i])>255) {//小于255但以前有溢出过rgb且加上之前溢出部分数据后大于255
                    data[i]=255;
                    overarr[i]+=data[i]+valChange+overarr[i]-255;
                }
                else {//小于255但以前有溢出过rgb且加上之前溢出部分数据后小于255
                    data[i]=data[i]+valChange+overarr[i];
                    overarr[i]=undefined;
                }
                
            }
            else {//小于255且以前未超出过
                data[i]+=valChange;
            }
        }
    }

    /**
    * 获取用户曾经上传的图片
    * @param  String 用户账号名
    */
    function getUsedImg (account) {
        var result;
        $.ajax({ 
            type:"get",
            async:false,
            url:"http://localhost:8080/getall",
            contentType:"application/json",//同步ajax，为了使导入用户图像后再加载网页功能
            data:{'account':account},

            success:function  (data) {
                result=data;
            },

            error:function  (err) {
                alert("用户未上传过照片");
                return null;
            },

        });

        return result;
    }


    /**
    * 将用户曾经上传的图片导入到页面的xxx处
    * @param  arr 曾经上传的图片[{图片名：图片base64编码},{图片名：图片base64编码}]形式
    * @param  id 图片导入的页面容器的id
    */
    function uploadUsedImg (result,id) {
        result.forEach(function  (val,index) {
            var key=Object.keys(val)[0];
            var img=document.createElement("img");
            img.id=key;
            img.src=val[key];
            $("#"+id)[0].appendChild(img);
        });
    }

