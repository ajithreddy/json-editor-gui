var jsonTestSuite = new (function($) {
	var _proto, objLiSample, arrayLiSample, normalKeyValueSample, contextMenuPopup, disableContextMenu = false, autoSugggestionsPopup, jsonTestsArea;
	var defaultJSON = {
		json : {}
	};
	this.init = function(initialJSON) {
		_proto = Object.prototype.toString;
		contextMenuPopup = $("#contextMenuPopup");
		autoSugggestionsPopup = $("#autoSugggestionsPopup");
		jsonTestsArea = $("#jsonTestsArea");
		prepareLayout();

		if (initialJSON) {
			defaultJSON.json = initialJSON;
		}

		populateSamples();
		populateDecorateAndAssignClasses(defaultJSON, jsonTestsArea);
		$(document)
				.on(
						"mousedown",
						".jsonHead",
						function(e) {
							if (e.which === 3) {
								disableContextMenu = true;
							}
							var $this = $(this);
							var classStr = "jsonHeadSelected";
							jsonTestsArea.find("." + classStr).removeClass(
									classStr);
							$this.addClass(classStr);

							var objectType = $this.parent().data("objectType");
							if (objectType !== "NORMAL" && e.which === 3) {
								var xPos = e.pageX;
								var yPos = e.pageY;
								makeContextMenu($this, objectType);
								contextMenuPopup.css({
									left : xPos,
									top : yPos
								}).show();
								var contextMenuEvent = "click.contextMenuEvent";
								$(document)
										.off(contextMenuEvent)
										.on(
												contextMenuEvent,
												function(eDocClick) {
													var target = $(eDocClick.target);
													if (target
															.closest(contextMenuPopup).length === 0
															&& target
																	.closest(".jsonHeadSelected").length === 0) {
														contextMenuPopup.hide();
														$(document)
																.off(
																		contextMenuEvent);
													}
												});
							} else {
								contextMenuPopup.hide();
							}
						});
		$(document).on("contextmenu", function(e) {
			// event is captured on document only
			if (disableContextMenu) {
				e.preventDefault();
				disableContextMenu = false;
			}
		});
		$(document).on("click", ".addToJSONSteps", addToJSONSteps).on("click",
				".addSiblingToJSONStep", addSiblingToJSONStep).on("click",
				".addSomethingToJSON", addSomethingToJSON).on("click",
				".minMaxJSON", minMaxJSON).on("click", ".moveUpJSONBlock",
				moveUpJSONBlock).on("click", ".moveDownJSONBlock",
				moveDownJSONBlock).on("click", ".deleteJSONBlock",
				deleteJSONBlock).on("click", ".jsonKey,.jsonNormalValue",
				prepareInputForJSONEdit).on("blur", ".jsonEditInput",
				removeInputForJSONEditOnBlur).on("keydown", ".jsonEditInput",
				removeInputForJSONEditOnEnterOrArrows).on("keyup",
				".jsonEditInput", removeInputForJSONEditOnTyping).on("click",
				".generateJSONButton", generateJSON).on("mousedown",
				".jsonSugg", jsonSuggClicked)
	};
	var prepareLayout = function() {
		var relax = jsonTestsArea.offset().top + 60 + 20;
		jsonTestsArea.css("min-height", ($(window).height() - relax));
	};

	// event handlers
	var addToJSONSteps = function() {
		contextMenuPopup.hide();
		var type = $(this).data("type");
		var jsonSample = jsonSamples[type];
		var targetUL = $(".jsonHeadSelected").siblings("ul");
		if (jsonSample && targetUL.length > 0) {
			populateDecorateAndAssignClasses(jsonSample, targetUL);
		} else {
			alert("Some error occured.");
		}
	};
	var addSiblingToJSONStep = function() {
		contextMenuPopup.hide();
		var type = $(this).data("type");
		var jsonSample = jsonSamples[type];
		var targetLi = $(".jsonHeadSelected").parent("li");
		if (jsonSample) {
			populateDecorateAndAssignClasses(jsonSample, targetLi.parent(),
					targetLi, $(this).data("pos"));
		} else {
			alert("Some error occured.");
		}
	};
	var addSomethingToJSON = function() {
		var type = $(this).data("type");
		contextMenuPopup.hide();
		var parentObjectType = contextMenuPopup.data("parentObjectType");
		var jsonSample = jsonSamples[parentObjectType + "_" + type];
		var targetUL = $(".jsonHeadSelected").siblings("ul");
		if (type && jsonSample && targetUL.length > 0) {
			populateDecorateAndAssignClasses(jsonSample, targetUL);
		}
	};
	var minMaxJSON = function() {
		var $this = $(this), className = "minimizeJSON";
		var jsonHead = $this.closest(".jsonHead");
		var jsonBlockEls = jsonHead.siblings("ul,.jsonTail");
		var collapseBlock = jsonHead.children(".jsonBlockCollapseEl");
		if ($this.hasClass(className)) {
			jsonBlockEls.hide();
			collapseBlock.show();
		} else {
			jsonBlockEls.show();
			collapseBlock.hide();
		}
		$this.toggleClass(className + " maximizeJSON");
	};
	var moveUpJSONBlock = function() {
		var li = $(this).closest("li");
		var prevLi = li.prev();
		if (prevLi.length > 0) {
			var newli = prevLi.clone(true);
			prevLi.remove();
			newli.insertAfter(li);
		}
	};
	var moveDownJSONBlock = function() {
		var li = $(this).closest("li");
		var nextLi = li.next();
		if (nextLi.length > 0) {
			var newli = nextLi.clone(true);
			nextLi.remove();
			newli.insertBefore(li);
		}
	};
	var deleteJSONBlock = function() {
		$(this).closest("li").remove();
	};
	var prepareInputForJSONEdit = function() {
		var $this = $(this);
		var val = $this.text();
		$this.hide();
		var inputType = "";
		if ($this.hasClass("jsonKey")) {
			inputType = "KEY";
		} else {
			inputType = "VALUE";
		}
		var input = makeHTMLTag("input", {
			type : "text",
			value : val,
			"data-input-type" : inputType,
			class : "jsonEditInput"
		});
		var pas = $this.parents("li");
		var index = pas.eq(pas.length - 2).index();
		inputOutputSuggs = getSuggestionsFromSession(index);
		input.insertAfter($(this)).focus();
	};
	var removeInputForJSONEditOnBlur = function() {
		removeInputForJSONEdit($(this));
	};
	var removeInputForJSONEditOnEnterOrArrows = function(e) {
		var $this = $(this);
		var keyNum = e.which || e.keyCode;
		var activeClassName = "jsonSuggActive";
		var activeEl = autoSugggestionsPopup.children(".jsonSuggActive");
		if (keyNum === 13) {
			var chosenVal;
			if (activeEl.length > 0
					&& autoSugggestionsPopup.css("display") !== "none") {
				chosenVal = activeEl.text();
			}
			removeInputForJSONEdit($this, chosenVal);
		} else if (keyNum === 38) {
			// up arrow
			var prevEl = activeEl.prev("li");
			if (prevEl.length > 0) {
				activeEl.removeClass(activeClassName);
				prevEl.addClass(activeClassName);
			}
		} else if (keyNum === 40) {
			// down arrow
			var nextEl = activeEl.next("li");
			if (nextEl.length > 0) {
				activeEl.removeClass(activeClassName);
				nextEl.addClass(activeClassName);
			}
		}
	};
	var jsonSuggClicked = function(e) {
		cancelEvent(e);
		var chosenValue = $(this).text();
		removeInputForJSONEdit(jsonTestsArea.find(".jsonEditInput"),
				chosenValue);
	};
	var removeInputForJSONEditOnTyping = function(e) {
		var keyNum = e.which || e.keyCode;
		if (keyNum === 38 || keyNum === 40) {
			return;
		}
		var $this = $(this);
		var offy = $this.offset();
		var suggContent = getSuggestionsContent($this.val(), $this
				.data("inputType"));
		if (suggContent.length > 0) {
			autoSugggestionsPopup.css({
				left : offy.left,
				top : (offy.top + $this.outerHeight(true))
			}).show().html(suggContent);
			autoSugggestionsPopup.children("li").first().addClass(
					"jsonSuggActive");
		} else {
			autoSugggestionsPopup.hide();
		}
	};
	var jsonKeySuggestions = [ "steps", "construct", "sid", "host", "path",
			"method", "input", "output", "params", "check", "name", "expected",
			"count" ];
	var jsonValueSuggestions = [ "TEST", "EXACT", "PRESENT", "START_SESSION",
			"END_SESSION", "START_LOOP", "END_LOOP" ];
	var inputOutputSuggs = [];
	var getSuggestionsContent = function(query, inputType) {
		if (!query.length > 0 || !inputType) {
			return "";
		}
		var suggsList;
		if (inputType === "KEY") {
			suggsList = jsonKeySuggestions;
		} else {
			suggsList = $.merge([], inputOutputSuggs, jsonValueSuggestions);
		}
		var suggContent = "";
		for ( var k = 0, l = suggsList.length; k < l; k++) {
			var sugg = suggsList[k];
			if (sugg.toLowerCase().indexOf(query.toLowerCase()) > -1) {
				suggContent += "<li class='jsonSugg'>" + sugg + "</li>";
			}
		}
		return suggContent;
	};
	var removeInputForJSONEdit = function($this, chosenVal) {
		var val = chosenVal || $this.val();
		$this.prev(".jsonKey,.jsonNormalValue").show().text(val);
		$this.remove();
		autoSugggestionsPopup.hide();
	};
	var generateJSON = function() {
		var jsonStr = "";
		try {
			jsonStr = JSON.stringify(extractJSON());
		} catch (err) {
			alert("Some error occured");
		}
		$("#finalJSONArea").html(jsonStr);
	};
	var makeContextMenu = function(jsonHead, parentObjectType) {
		contextMenuPopup.children(".addToJSONSpecialUl").hide();
		contextMenuPopup.data("parentObjectType", parentObjectType);
		if (parentObjectType === "ARRAY") {
			// for an array 'Add a Key Value Pair' doesn't make sense
			contextMenuPopup.find("li").last().html("Add an Entry");
		} else {
			contextMenuPopup.find("li").last().html("Add a Key Value Pair");
		}
		var jsonHeadKey = jsonHead.find(".jsonKey").text();
		var jsonHeadParents = jsonHead.parents("ul");
		if (jsonHeadParents.eq(1).is(jsonTestsArea) && jsonHeadKey === "steps") {
			$("#addToJSONStepsUl").show();
		} else if (jsonHeadParents.eq(2).is(jsonTestsArea) && !jsonHeadKey) {
			$("#addSiblingToJSONStepUl").show();
		} else if (jsonHeadParents.eq(3).is(jsonTestsArea)
				&& jsonHeadKey === "output") {
			$("#addParamsToOutputUl").show();
		} else if ((jsonHeadParents.eq(4).is(jsonTestsArea) && jsonHeadKey === "params")
				|| (jsonHeadKey === "expected" && jsonHead.parent().data(
						"objectType") === "ARRAY")) {
			$("#addCheckBlocksToParamsUl").show();
		} else {
			var parentUl = jsonHead.closest("ul");
			var parentKey = parentUl.siblings(".jsonHead").find(".jsonKey")
					.text();
			var oType = parentUl.parent().data("objectType");
			if ((parentKey === "params" || parentKey === "expected")
					&& oType === "ARRAY") {
				$("#addCheckBlocksAsSiblingsUl").show();
			}
		}
	};
	var jsonSamples = {
		TEST_CONSTRUCT : [ {
			"construct" : "TEST",
			"sid" : "",
			"host" : "http://localhost:19001",
			"path" : "",
			"method" : "GET",
			"input" : {},
			"output" : {}
		} ],
		START_LOOP : [ {
			"construct" : "START_LOOP"
		}, {
			"construct" : "END_LOOP"
		} ],
		START_SESSION : [ {
			"construct" : "START_SESSION"
		}, {
			"construct" : "END_SESSION"
		} ],
		CHECK_EXACT : [ {
			"check" : "EXACT",
			"name" : "",
			"expected" : ""
		} ],
		CHECK_PRESENT : [ {
			"check" : "PRESENT",
			"name" : "",
			"expected" : []
		} ],
		OUTPUT_PARAMS : {
			params : []
		},
		ARRAY_OBJECT : [ {} ],
		ARRAY_ARRAY : [ [] ],
		OBJECT_OBJECT : {
			KEY : {}
		},
		OBJECT_ARRAY : {
			KEY : []
		},
		ARRAY_NORMAL : [ "To Be Specified" ],
		OBJECT_NORMAL : {
			KEY : "VALUE"
		}
	}

	var populateSamples = function() {
		var lis = $("#jsonSamples").children();
		objLiSample = lis.eq(0);
		arrayLiSample = lis.eq(1);
		normalKeyValueSample = lis.eq(2);
	}
	var populateUL = function(obj, ul, liChild, insertPos) {
		var ulType = ul.parent().data("objectType");
		$.each(obj, function(key, value) {
			var li;
			var objectType = _proto.call(value);
			if (objectType === "[object Array]") {
				// array
				li = arrayLiSample.clone(true);
				li.find(".jsonKey").text(key);
				populateUL(value, li.children(".jsonBody"));
			} else if (objectType === "[object Object]") {
				// object
				li = objLiSample.clone(true);
				li.find(".jsonKey").text(key);
				populateUL(value, li.children(".jsonBody"));
			} else {
				// normal key value pair
				li = normalKeyValueSample.clone(true);
				li.find(".jsonKey").text(key);
				li.find(".jsonNormalValue").text(value);
				if (objectType === "[object String]") {
					li.find(".jsonNormalValue").addClass(
							"jsonNormalStringValue");
				} else {
					li.find(".jsonNormalValue").addClass(
							"jsonNormalNumberValue");
				}
			}
			if (ulType === "ARRAY") {
				li.children(".jsonHead").children(".jsonKey,.keyValueSep")
						.remove();
			}
			if (liChild && insertPos) {
				// ==> to insert as a sibling of lichild and at insertpos
				if (insertPos === "BELOW") {
					li.insertAfter(liChild);
				} else {
					li.insertBefore(liChild);
				}
			} else {
				ul.append(li);
			}
		});
	};
	var decorateUls = function(uls, ulIndex) {
		ulIndex++;
		for ( var k = 0, l = uls.length; k < l; k++) {
			var lis = uls.eq(k).children("li");
			for ( var i = 0, n = lis.length; i < n; i++) {
				var li = lis.eq(i);
				var paddingLeft = ulIndex * 30;
				var els = li.find(".jsonHead,.jsonTail");
				var elsPaType = els.parent().data("objectType");
				// if (elsPaType === "OBJECT" || elsPaType === "ARRAY") {
				// paddingLeft -= 15;
				// }
				els.css("padding-left", paddingLeft);
				decorateUls(li.children("ul"), ulIndex);
			}
		}
	};
	var assignClasses = function() {
		// a fn to loop through entire html and assign classes which will help
		// in other functionality

	};
	var populateDecorateAndAssignClasses = function(jsonSample, targetUL,
			liChild, insertPos) {
		populateUL(jsonSample, targetUL, liChild, insertPos);
		decorateUls(jsonTestsArea, 0);
		assignClasses();
	}
	var extractJSON = function() {
		return extractValuesFromUL(jsonTestsArea, "OBJECT").json;
	};
	var extractValuesFromUL = function(ul, ulType) {
		var ulValues;
		if (ulType === "ARRAY") {
			ulValues = [];
		} else if (ulType === "OBJECT") {
			ulValues = {};
		}
		var lis = ul.children();
		for ( var i = 0, n = lis.length; i < n; i++) {
			var li = lis.eq(i);
			var liObjectType = li.data("objectType");
			var liKey = li.children(".jsonHead").children(".jsonKey").text();
			var value;
			if (liObjectType === "ARRAY" || liObjectType === "OBJECT") {
				if (ulType === "ARRAY") {
					ulValues.push(extractValuesFromUL(li.children("ul"),
							liObjectType));
				} else if (ulType === "OBJECT") {
					ulValues[liKey] = extractValuesFromUL(li.children("ul"),
							liObjectType);
				}
			} else {
				if (ulType === "ARRAY") {
					ulValues.push(li.find(".jsonNormalValue").text());
				} else if (ulType === "OBJECT") {
					ulValues[liKey] = li.find(".jsonNormalValue").text();
				}
			}
		}
		return ulValues;
	};
	var makeHTMLTag = function(tag, attrs) {
		var el = document.createElement(tag);
		if (attrs) {
			for ( var k in attrs)
				el.setAttribute(k, attrs[k]);
		}
		return $(el);
	};
	var cancelEvent = function(e) {
		e = e || window.event;
		if (e.preventDefault && e.stopPropagation) {
			e.preventDefault();
			e.stopPropagation();
		}
		return false;
	};
	var getSuggestionsFromSession = function(liIndex) {
		var finalSuggs = [];
		try {
			var json = extractJSON();
			var stepsList = json.steps;
			var newList = [];
			var foundEndSession = false, foundStartSession = false;
			for ( var k = liIndex, l = stepsList.length; k < l; k++) {
				var step = stepsList[k];
				var stepName = step.construct;
				if (stepName !== "END_SESSION") {
					newList.push(step);
				} else {
					foundEndSession = true;
					break;
				}
			}
			for ( var k = liIndex - 1; k >= 0; k--) {
				var step = stepsList[k];
				var stepName = step.construct;
				if (stepName !== "START_SESSION") {
					newList.push(step);
				} else {
					foundStartSession = true;
					break;
				}
			}
			if (!foundEndSession || !foundStartSession || !newList.length > 0) {
				return [];
			}

			for ( var k = 0, l = newList.length; k < l; k++) {
				var step = newList[k];
				var input = step.input;
				var sid = step.sid;
				if (!sid) {
					return;
				}
				if (input) {
					var inputPrefix = "$IN[" + sid + "]";
					$.each(input,
							function(k, v) {
								var t = _proto.call(v);
								if (t === "[object String]"
										|| t === "[object Number]") {
									finalSuggs
											.push(inputPrefix + "[" + k + "]");
								}
							});
				}
				if (step.output && step.output.params) {
					var outputParams = step.output.params;
					var outputPrefix = "$OUT[" + sid + "]";
					var suggs = pickSuggsFromParamsList(outputParams,
							outputPrefix);
					$.merge(finalSuggs, suggs);
				}
			}
		} catch (err) {
			console.log("Error is preparing input output suggestions");
		}
		return finalSuggs;
	};
	var pickSuggsFromParamsList = function(list, prefix) {
		var suggs = [];
		for ( var n = 0, m = list.length; n < m; n++) {
			var param = list[n];
			var t = _proto.call(param.expected);
			console.log(param.name)
			console.log(t);
			if (param.name) {
				if (t === "[object ARRAY]") {
					pickSuggsFromParamsList(param.expected, prefix + "["
							+ param.name + "]");
				} else {
					suggs.push(prefix + "[" + param.name + "]");
				}
			}
		}
		return suggs;
	};
})(jQuery);

var stepsList = {
	"default" : {
		"host" : "",
		"method" : "GET"
	},
	"steps" : []
};
jsonTestSuite.init(stepsList);
