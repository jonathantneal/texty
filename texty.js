(function(win, doc, textyName) {
	// Detect browser's selection capabilities
	texty = win[textyName] = {
		hasSelectionStart: 'selectionStart' in doc.createElement('textarea'),
		hasWinGetSelection: 'getSelection' in win,
		hasDocSelection: 'selection' in doc,
		hasProperLines: !doc.documentMode
	};
	// Create a document fragment for a sandbox
	var docFrag = doc.createDocumentFragment();
	// Fail texty if minimum requirements are not met
	if (!texty.hasSelectionStart) return;
	/*
	_randId
		returns a random id
	*/
	function _randId() {
		// Return a random number
		return (new Date().getDate())+(''+Math.random()).substr(2)
	}
	/*
	_element
		Return the closest dom element
	*/
	function _element(node) {
		// Return the closest dom element
		return node.nodeType == 1 ? node : node.parentNode;
	}
	/*
	_content
		Return the content of a node
		Optionally assign the content of a dom element

		node: element to use
		content: content to set
	*/
	function _content(node, content) {
		//
		var contentType = node.nodeType == 1 ? 'innerHTML' : 'data';
		//
		if (content) node[contentType] = content;
		//
		return node[contentType];
	}
	/*
	_getRange
		Return a range object representing the current selection
	*/
	function _getRange() {
		// sel: a selection object representing the range of text selected by the user
		var sel = win.getSelection();
		// Return a range object representing the current selection or false
		return (sel.rangeCount) ? sel.getRangeAt(0) : false;
	}
	/*
	_nodeIndex
		Return the index of a node

		node: dom element to use
	*/
	function _nodeIndex(node) {
		// 
		if (!node.parentNode) return 0;
		// 
		var nodes = node.parentNode.childNodes,
			index = 0;
		// 
		while (node != nodes[index]) ++index;
		// 
		return index;
	}
	/*
	_pathToNode
		Return an index path to a node from an ancestor node

		node: dom element to find (the needle)
		ancestorNode: dom element to look in (the haystack)
	*/
	function _pathToNode(node, ancestorNode) {
		// 
		var arr = [];
		// 
		while (node != ancestorNode) {
			arr.push(_nodeIndex(node));
			node = node.parentNode;
		}
		// 
		return arr.reverse();
	}
	/*
	_nodeFromPath
		Return a node from an ancestor node based on an index path

		path: texty path to follow (the map to the needle)
		ancestorNode: dom element to look in (the haystack)
	*/
	function _nodeFromPath(path, ancestorNode) {
		// 
		var pathLen = path.length,
			index = -1,
			node;
		// 
		while (++index < pathLen) ancestorNode = ancestorNode.childNodes[path[index]];
		// Return the ancestor node
		return ancestorNode;
	}
	/*
	_elementById
		Return an element by ID

		scope: dom element look in (the haystack)
		id: dom element id to look for (the name of the needle)
	*/
	function _elementById(scope, id) {
		// If matched, return the element
		if (scope.id == id) return scope;
		//
		var nodes = scope.childNodes,
			nodesLen = nodes.length,
			i = -1,
			node;
		//
		while (++i < nodesLen) {
			node = _elementById(nodes[i], id);
			// If matched, return the element
			if (node) return node;
		}
		// If unmatched, return false
		return false;
	}
	/*
	_offsetFromRange
		Return the index of the regular expression inside the string or -1.

		range: dom range to use
		scope: dom element to look in
		atStart: direction (start/end) to look from
	*/
	function _offsetFromRange(range, scope, atStart) {
		//
		var dir = atStart ? 'start' : 'end',
			clone = scope.cloneNode(true),
			node = range[dir+'Container'],
			offset = range[dir+'Offset'],
			path = _pathToNode(node, scope),
			dupe = _nodeFromPath(path, clone),
			range = doc.createRange(),
			rand = _randId(),
			re = new RegExp('<[^<]+'+rand),
			anchorNode = doc.createElement('a');
		//
		docFrag.appendChild(clone); // opera
		//
		anchorNode.id = rand;
		//
		range.setStart(dupe, offset);
		range.collapse(true);
		range.insertNode(anchorNode);
		//
		docFrag.removeChild(clone); // opera
		// Return the index of the regular expression inside the string or -1.
		return clone.innerHTML.search(re);
	}
	/*
	_selectionFromOptions
		Return a texty selection object of the container node and the offset index

		opts: texty object to use as options
		scope: dom element to look in
		atStart: direction (start/end) to look from
	*/
	function _selectionFromOptions(opts, scope, atStart) {
		// clone: an element of the same node type
		// rand: a random id
		// anchorHtml: an anchor's HTML
		// dir: direction (start/end) to look from
		// content: HTML of the selection
		var clone = doc.createElement(scope.nodeName),
			rand = _randId(),
			anchorHtml = '<a id="'+rand+'"></a>',
			dir = atStart ? 'start' : 'end',
			content = [opts.contentAll.substr(0,opts[dir]), anchorHtml, opts.contentAll.substr(opts[dir])].join('');
		//
		clone.innerHTML = content;
		//
		var dupe = _elementById(clone, rand),
			prevIsText = !!dupe.previousSibling && dupe.previousSibling.nodeType == 3,
			prev = prevIsText ? dupe.previousSibling : dupe.parentNode,
			offs = prevIsText ? _content(prev).length : _nodeIndex(dupe),
			path = _pathToNode(prev, clone),
			node = _nodeFromPath(path, scope);
		// Return a texty selection object of the container node and the offset index
		return {
			container: node,
			offset: offs
		};
	}
	/*
	getTextSelection
		Return a texty object of the selection

		el: dom element to look in
	*/
	texty.getTextSelection = function(el) {
		// val: textarea's content
		// selectionStart: starting index of the selection
		// selectionEnd: ending index of the selection
		var val = texty.hasProperLines ? el.value : el.value.replace(/\r\n/g, '\n'),
			selectionStart = el.selectionStart,
			selectionEnd = el.selectionEnd;
		// Return a texty object of the selection
		return {
			element: el,
			start: selectionStart,
			end: selectionEnd,
			length: selectionEnd - selectionStart,
			content: val.substr(selectionStart, selectionEnd - selectionStart),
			contentBefore: val.substr(0, selectionStart),
			contentAfter: val.substr(selectionEnd),
			contentAll: val
		};
	};
	/*
	setTextSelection
		Set the textarea's content and selected text

		el: the textarea to use
		opts: the texty options to define the textarea's selection
	*/
	texty.setTextSelection = function(el, opts) {
		// Set the textarea's content and selected text
		el.value = opts.contentAll;
		el.selectionStart = opts.start;
		el.selectionEnd = opts.end;
	};
	/*
	getNodeSelection
		Return a texty object representing the selection details of an element

		scope: optional dom element to look in (otherwise the common ancestor of the selection points)
	*/
	texty.getNodeSelection = function(scope) {
		// Get a range object representing the current selection
		var range = _getRange();
		// Return false if no range object exists
		if (!range) return false;
		// Get the scope of the selection
		scope = scope || _element(range.commonAncestorContainer);
		// Get the contents of the scope
		var contentAll = scope.innerHTML;
		// Get the start and end indexes of a selection
		selectionStart = _offsetFromRange(range, scope, true);
		selectionEnd = _offsetFromRange(range, scope, false);
		// Return a texty object representing the selection details of an element
		return {
			element: scope,
			start: selectionStart,
			end: selectionEnd,
			length: selectionEnd - selectionStart,
			content: contentAll.substr(selectionStart, selectionEnd - selectionStart),
			contentBefore: contentAll.substr(0, selectionStart),
			contentAfter: contentAll.substr(selectionEnd),
			contentAll: contentAll
		};
	};
	/*
	setNodeSelection
		Set a selection on an element

		el: the dom element to use
		opts: the texty options to define the selection
	*/
	texty.setNodeSelection = function(el, opts) {
		// Set the HTML of the element
		el.innerHTML = opts.contentAll;
		// sel: a selection object representing the range of text selected by the user
		// range: a range object representing a fragment of a document
		// selectionStart: a texty object representing the starting range
		// selectionEnd: a texty object representing the ending range
		var sel = win.getSelection(),
			range = doc.createRange(),
			selectionStart = _selectionFromOptions(opts, el, true),
			selectionEnd = _selectionFromOptions(opts, el, false);
		// Remove and reset all ranges from the selection
		sel.removeAllRanges();
		// Set the start and end positions of the range
		range.setStart(selectionStart.container, selectionStart.offset);
		range.setEnd(selectionEnd.container, selectionEnd.offset);
		// Add a range to the selection.
		sel.addRange(range);
	};
	/*
	setNodeSelectionByElement
		Set the range to contain the node and its contents

		el: the element to use
	*/
	texty.setNodeSelectionByElement = function(el) {
		// sel: a selection object representing the range of text selected by the user
		// range: a range object representing a fragment of a document
		var sel = win.getSelection(),
			range = doc.createRange();
		// Remove and reset all ranges from the selection
		sel.removeAllRanges();
		// Set the range to contain the node and its contents
		range.selectNode(el);
		// Add a range to the selection.
		sel.addRange(range);
	};
})(this, document, 'texty');
