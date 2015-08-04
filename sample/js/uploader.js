!function e(t,i,n){function s(o,r){if(!i[o]){if(!t[o]){var l="function"==typeof require&&require;if(!r&&l)return l(o,!0);if(a)return a(o,!0);var u=new Error("Cannot find module '"+o+"'");throw u.code="MODULE_NOT_FOUND",u}var h=i[o]={exports:{}};t[o][0].call(h.exports,function(e){var i=t[o][1][e];return s(i?i:e)},h,h.exports,e,t,i,n)}return i[o].exports}for(var a="function"==typeof require&&require,o=0;o<n.length;o++)s(n[o]);return s}({1:[function(e,t,i){ne.util.defineNamespace("ne.component.Uploader",e("./src/js/uploader.js"))},{"./src/js/uploader.js":6}],2:[function(e,t,i){var n={type:"POST",addRequest:function(e){var t=this._uploader.inputView.$el,i=ne.util.bind(this.successPadding,this,e.success);this.formData=new FormData(t[0]),$.ajax({url:this._uploader.url.send,type:this.type,data:this.formData,success:i,processData:!1,contentType:!1,error:e.error})},successPadding:function(e,t){var i=JSON.parse(t),n={};n.items=i.filelist,e(n)},removeRequest:function(e){var t=ne.util.bind(this.removePadding,this,e.success);$.ajax({url:this._uploader.url.remove,data:e.data,success:t,error:e.error})},removePadding:function(e,t){var i=JSON.parse(t),n={};n.action="remove",n.name=decodeURIComponent(i.name),e(n)}};t.exports=n},{}],3:[function(e,t,i){var n=e("./ajax.js"),s=e("./jsonp.js"),a=ne.util.defineClass({init:function(e){var t="ajax"===e.type?n:s;this._uploader=e,this.mixin(t)},send:function(e){"remove"===e.type?this.removeRequest(e):this.addRequest(e)},mixin:function(e){ne.util.extend(this,e)}});t.exports=a},{"./ajax.js":2,"./jsonp.js":4}],4:[function(e,t,i){var n={addRequest:function(e){var t=this._uploader.callbackName,i=e.success;ne.util.defineNamespace(t,ne.util.bind(this.successPadding,this,i)),this._uploader.inputView.$el.submit()},successPadding:function(e,t){var i={};i.items=this._uploader.isCrossDomain()?this._getSplitItems(t):t.filelist,e(i)},_getSplitItems:function(e){var t=this._uploader.separator,i=e.status.split(t),n=e.names.split(t),s=e.sizes.split(t),a=[];return ne.util.forEach(i,function(e,t){if("success"===e){var o={name:n[t],status:i[t],size:s[t]};a.push(o)}}),a},removeRequest:function(e){var t=this._uploader.callbackName,i={callback:t},n=e.success;ne.util.defineNamespace(t,ne.util.bind(this.removePadding,this,n),!0),$.ajax({url:this._uploader.url.remove,dataType:"jsonp",jsonp:t,data:ne.util.extend(i,e.data)})},removePadding:function(e,t){var i={};i.action="remove",i.name=decodeURIComponent(t.name),e(i)}};t.exports=n},{}],5:[function(e,t,i){t.exports.CONF={RESPONSE_TYPE:"RESPONSE_TYPE",REDIRECT_URL:"REDIRECT_URL",JSONPCALLBACK_NAME:"CALLBACK_NAME",SIZE_UNIT:"SIZE_UNIT",REMOVE_CALLBACK:"responseRemoveCallback",ERROR:{DEFAULT:"Unknown error.",NOT_SURPPORT:"This is x-domain connection, you have to make helper page."}},t.exports.HTML={input:['<form enctype="multipart/form-data" id="formData" method="post">','<input type="hidden" name="MAX_FILE_SIZE" value="3000000" />','<input type="file" id="fileAttach" name="userfile[]" multiple="true" />',"</form>"].join(""),item:['<li class="filetypeDisplayClass">','<spna class="fileicon {{filetype}}">{{filetype}}</spna>','<span class="file_name">{{filename}}</span>','<span class="file_size">{{filesize}}</span>','<button type="button" class="{{deleteButtonClassName}}">Delete</button>',"</li>"].join("")}},{}],6:[function(e,t,i){var n=e("./statics.js"),s=e("./connector/connector.js"),a=e("./view/input.js"),o=e("./view/list.js"),r=ne.util.defineClass({init:function(e,t){this._setData(e),this._setConnector(),this.$el=t,this.inputView=new a(e,this),this.listView=new o(e,this),this._addEvent()},_setConnector:function(){this.isCrossDomain()?this.helper?this.type="jsonp":alert(n.CONF.ERROR.NOT_SURPPORT):this.type=this.useJsonp||!this._isSupportDataForm()?"jsonp":"ajax",this._connector=new s(this)},notify:function(e){this.listView.update(e),this.listView.updateTotalInfo(e)},_setData:function(e){ne.util.extend(this,e)},isCrossDomain:function(){var e=document.domain;return-1===this.url.send.indexOf(e)},_isSupportDataForm:function(){var e=FormData||null;return!!e},sendFile:function(){var e=ne.util.bind(this.notify,this);this._connector.send({type:"add",success:e,error:this.errorCallback})},errorCallback:function(e){var t;t=e&&e.msg?e.msg:n.CONF.ERROR.DEFAULT,alert(t)},removeFile:function(e){var t=ne.util.bind(this.notify,this);this._connector.send({type:"remove",data:e,success:t})},_addEvent:function(){this.listView.on("remove",this.removeFile,this),this.inputView.on("change",this.sendFile,this)}});ne.util.CustomEvents.mixin(r),t.exports=r},{"./connector/connector.js":3,"./statics.js":5,"./view/input.js":7,"./view/list.js":9}],7:[function(e,t,i){var n=e("../statics.js"),s=ne.util.defineClass({init:function(e,t){this._uploader=t,this._target=e.formTarget,this._url=e.url,this._isBatchTransfer=e.isBatchTransfer,this.html=e.template&&e.template.input||n.HTML.input,this._render(),this._renderHiddenElements(),e.helper&&this._makeBridgeInfoElement(e.helper),this._addEvent()},_render:function(){this.$el=$(this.html),this.$el.attr({action:this._url.send,method:"post",enctype:"multipart/form-data",target:this._target}),this._uploader.$el.append(this.$el)},_renderHiddenElements:function(){this._makeTargetFrame(),this._makeResultTypeElement(),this._makeCallbackElement(),this._makeSizeUnit()},_addEvent:function(){this._isBatchTransfer?this.$el.on("change",ne.util.bind(this.saveChange,this)):this.$el.on("change",ne.util.bind(this.onChange,this))},onChange:function(){this.fire("change",{target:this})},saveChange:function(){this.fire("save",{element:this.$el[0]}),this._changeElement()},_changeElement:function(){this._render(),this._addEvent()},_makeTargetFrame:function(){this._$target=$('<iframe name="'+this._target+'"></iframe>'),this._$target.css({visibility:"hidden",position:"absolute"}),this._uploader.$el.append(this._$target)},_makeSizeUnit:function(){this._$sizeunit=this._makeHiddenElement({name:n.CONF.SIZE_UNIT,value:this._uploader.sizeunit}),this.$el.append(this._$sizeunit)},_makeCallbackElement:function(){this._$callback=this._makeHiddenElement({name:n.CONF.JSONPCALLBACK_NAME,value:this._uploader.callbackName}),this.$el.append(this._$callback)},_makeResultTypeElement:function(){this._$resType=this._makeHiddenElement({name:this._uploader.resultTypeElementName||n.CONF.RESPONSE_TYPE,value:this._uploader.type}),this.$el.append(this._$resType)},_makeBridgeInfoElement:function(e){this._$helper=this._makeHiddenElement({name:e.name||n.CONF.REDIRECT_URL,value:e.url}),this.$el.append(this._$helper)},_makeHiddenElement:function(e){return ne.util.extend(e,{type:"hidden"}),$("<input />").attr(e)}});ne.util.CustomEvents.mixin(s),t.exports=s},{"../statics.js":5}],8:[function(e,t,i){var n=e("../statics.js"),s=ne.util.defineClass({init:function(e){this._setRoot(e),this._setItemInfo(e),this._setConnectInfo(e),this.render(e.template||n.HTML.item),e.helper&&this._makeBridgeInfoElement(e.helper)},_setRoot:function(e){this._root=e.root,this._$root=e.root.$el},_setItemInfo:function(e){this.name=e.name,this._type=e.type||this._extractExtension(),this._id=e.id||e.name,this.size=e.size||"",this._btnClass=e.deleteButtonClassName||"uploader_btn_delete",this._unit=e.unit||"KB"},_setConnectInfo:function(e){this._url=e.url,this._hiddenInputName=e.hiddenFieldName||"filename"},render:function(e){var t=this._getHtml(e);this._$el=$(t),this._$root.append(this._$el),this._addEvent()},_extractExtension:function(){return this.name.split(".").pop()},_makeBridgeInfoElement:function(e){this.$helper=$("<input />"),this.$helper.attr({name:e.name,value:e.url})},_getHtml:function(e){var t={filetype:this._type,filename:this.name,filesize:this._getSizeWithUnit(this.size),deleteButtonClassName:this._btnClass};return e=e.replace(/\{\{([^\}]+)\}\}/g,function(e,i){return t[i]})},_getSizeWithUnit:function(e){return e+this._unit},destroy:function(){this._removeEvent(),this._$el.remove()},_addEvent:function(){var e="."+this._btnClass,t=this._$el.find(e);t.on("click",ne.util.bind(this._onClickEvent,this))},_removeEvent:function(){var e="."+this._btnClass,t=this._$el.find(e);t.off("click")},_onClickEvent:function(){this.fire("remove",{filename:this.name,id:this._id,type:"remove"})}});ne.util.CustomEvents.mixin(s),t.exports=s},{"../statics.js":5}],9:[function(e,t,i){var n=(e("../statics.js"),e("./item.js"),ne.util.defineClass({init:function(e,t,i){var n=e.listInfo;this.items=[],this.$el=n.list,this.$counter=n.count,this.$size=n.size,this._uploader=t,ne.util.extend(this,e)},update:function(e){"remove"===e.action?this.items=ne.util.filter(this.items,function(t){return decodeURIComponent(e.name)===decodeURIComponent(t.name)?(t.destroy(),!1):!0}):this._addFiles(e.items)},updateTotalInfo:function(e){this._updateTotalCount(e.count),this._updateTotalUsage(e.size)},_updateTotalCount:function(e){ne.util.isExisty(e)||(e=this.items.length),this.$counter.html(e)},_updateTotalUsage:function(e){ne.util.isExisty(e)||(e=this._getSumAllItemUsage()),this.$size.html(e)},_getSumAllItemUsage:function(){var e=this.items,t=0;return ne.util.forEach(e,function(e){t+=parseInt(e.size,10)}),t+this.sizeunit},_addFiles:function(e){ne.util.isArray(e)||(e=[e]),ne.util.forEach(e,function(e){this.items.push(this._createItem(e))},this)},_createItem:function(e){var t=new ne.component.Uploader.View.Item({root:this,name:e.name,size:e.size,deleteButtonClassName:this.deleteButtonClassName,url:this.url,hiddenFrame:this.formTarget,hiddenFieldName:this.hiddenFieldName,template:this.template&&this.template.item,unit:this.sizeunit});return t.on("remove",this._removeFile,this),t},_removeFile:function(e){this.fire("remove",e)}}));ne.util.CustomEvents.mixin(n),t.exports=n},{"../statics.js":5,"./item.js":8}]},{},[1]);