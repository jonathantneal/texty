(function(win, doc, textyName) {
	// detect browser's selection capabilities
	texty = win[textyName] = {
		hasSelectionStart: 'selectionStart' in doc.createElement('textarea'),
		hasWinGetSelection: 'getSelection' in win,
		hasDocSelection: 'selection' in doc,
		hasProperLines: !doc.documentMode
	};
	// create a document fragment for a sandbox
	var docFrag = doc.createDocumentFragment();
	// fail texty if minimum requirements are not met
	if (!texty.hasSelectionStart) return;
	/*
	_randId
		returns a random id
	*/
	function _randId() {
		//
		return (new Date().getDate())+(''+Math.random()).substr(2)
	}
	/*
	_element
		returns closest node dom element
	*/
	function _element(node) {
		//
		return node.nodeType == 1 ? node : node.parentNode;
	}
	/*
	_content
		assigns content to a dom element
		returns content of a dom element

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
		returns a document range (rich selection)
	*/
	function _getRange() {
		//
		var sel = win.getSelection();
		//
		return (sel.rangeCount) ? sel.getRangeAt(0) : false;
	}
	/*
	_nodeIndex
		returns a custom index point of a node

		node: dom element to use
	*/
	function _nodeIndex(node) {
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
		returns a custom index path to a node from an ancestor node

		node: dom element to use
		scope: dom element to look in
	*/
	function _pathToNode(node, scope) {
		//
		var arr = [];
		//
		while (node != scope) {
			arr.push(_nodeIndex(node));
			node = node.parentNode;
		}
		//
		return arr.reverse();
	}
	/*
	_nodeFromPath
		returns a node from an ancestor node based on a custom index path

		path: texty path to use
		scope: dom element to look in
	*/
	function _nodeFromPath(path, scope) {
		//
		var pathLen = path.length,
			index = -1,
			node;
		//
		while (++index < pathLen) scope = scope.childNodes[path[index]];
		//
		return scope;
	}
	/*
	_elementById
		returns an element based on an id or returns false

		scope: dom element look in
		id: dom element id to look for
	*/
	function _elementById(scope, id) {
		//
		if (scope.id == id) return scope;
		//
		var nodes = scope.childNodes,
			nodesLen = nodes.length,
			i = -1,
			node;
		//
		while (++i < nodesLen) {
			node = _elementById(nodes[i], id);
			if (node) return node;
		}
		//
		return false;
	}
	/*
	_offsetFromRange
		returns a numerical offset of a selection of an element

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
			a = doc.createElement('a');
		//
		docFrag.appendChild(clone); // opera
		//
		a.id = rand;
		//
		range.setStart(dupe, offset);
		range.collapse(true);
		range.insertNode(a);
		//
		docFrag.removeChild(clone); // opera
		//
		return clone.innerHTML.search(re);
	}
	/*
	_selectionFromOptions
		returns a custom selection from texty options, a scope, and a direction

		opts: texty object to use as options
		scope: dom element to look in
		atStart: direction (start/end) to look from
	*/
	function _selectionFromOptions(opts, scope, atStart) {
		//
		var clone = doc.createElement(scope.nodeName),
			rand = _randId(),
			a = '<a id="'+rand+'"></a>',
			re = new RegExp('<[^<]+'+rand),
			dir = atStart ? 'start' : 'end',
			content = [opts.contentAll.substr(0,opts[dir]), a, opts.contentAll.substr(opts[dir])].join('');
		//
		clone.innerHTML = content;
		//
		var dupe = _elementById(clone, rand),
			prevIsText = !!dupe.previousSibling && dupe.previousSibling.nodeType == 3,
			prev = prevIsText ? dupe.previousSibling : dupe.parentNode,
			offs = prevIsText ? _content(prev).length : _nodeIndex(dupe),
			path = _pathToNode(prev, clone),
			node = _nodeFromPath(path, scope);
		//
		return {
			container: node,
			offset: offs
		};
	}
	/*
	getTextSelection
		returns custom text selection details of an element

		el: dom element to look in
	*/
	texty.getTextSelection = function(el) {
		//
		var val = texty.hasProperLines ? el.value : el.value.replace(/\r\n/g, '\n'),
			selectionStart = el.selectionStart,
			selectionEnd = el.selectionEnd;
		//
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
		sets a text selection on an element

		el: the dom element to use
		opts: the texty options to define the selection
	*/
	texty.setTextSelection = function(el, opts) {
		//
		el.value = opts.contentAll;
		el.selectionStart = opts.start;
		el.selectionEnd = opts.end;
	};
	/*
	getNodeSelection
		returns custom node selection details of an element

		scope: optional dom element to look in (otherwise the common ancestor of the selection points)
	*/
	texty.getNodeSelection = function(scope) {
		//
		var range = _getRange();
		//
		if (!range) return;
		//
		scope = scope || _element(range.commonAncestorContainer);
		//
		var contentAll = scope.innerHTML;
		//
		aOffs = _offsetFromRange(range, scope, true);
		bOffs = _offsetFromRange(range, scope, false);
		//
		return {
			element: scope,
			start: aOffs,
			end: bOffs,
			length: bOffs - aOffs,
			content: contentAll.substr(aOffs, bOffs - aOffs),
			contentBefore: contentAll.substr(0, aOffs),
			contentAfter: contentAll.substr(bOffs),
			contentAll: contentAll
		};
	};
	/*
	setNodeSelection
		sets a node selection on an element

		el: the dom element to use
		opts: the texty options to define the selection
	*/
	texty.setNodeSelection = function(el, opts) {
		//
		el.innerHTML = opts.contentAll;
		//
		var sel = win.getSelection(),
			range = doc.createRange(),
			aSelection = _selectionFromOptions(opts, el, true),
			bSelection = _selectionFromOptions(opts, el, false);
		//
		sel.removeAllRanges();
		//
		range.setStart(aSelection.container, aSelection.offset);
		range.setEnd(bSelection.container, bSelection.offset);
		//
		sel.addRange(range);
	};
	/*
	setNodeSelectionByElement
		sets a node selection on an element as the entire element

		el: the dom element to use
	*/
	texty.setNodeSelectionByElement = function(el) {
		//
		var sel = win.getSelection(),
			range = doc.createRange();
		//
		sel.removeAllRanges();
		//
		range.selectNode(el);
		//
		sel.addRange(range);
	};
})(this, document, 'texty');