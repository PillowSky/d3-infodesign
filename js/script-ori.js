var w = innerWidth,
	h = innerHeight,
	node,
	link,
	root;

var fisheye = d3.fisheye.circular()
	.radius(200)
	.distortion(10);

var force = d3.layout.force()
	.on("tick", onTick)
	.charge(function(d) {
		return d._children ? -d.size / 100 : -30;
	})
	.linkDistance(function(d) {
		return d.target._children ? 80 : 30;
	})
	.size([w, h]);

var vis = d3.select("svg#main")
	.on("mousemove", onMouseMove)

d3.json("js/flare.json", function(json) {
	window.root = json;
	window.root.fixed = true;
	window.root.x = w / 2;
	window.root.y = h / 2;
	update();
});

// Color leaf nodes orange, and packages white or blue.
function color(d) {
	return d._children ? "#3182bd" : d.children ? "#c6dbef" : "#fd8d3c";
}

// Returns a list of all nodes under the root.
function flatten(root) {
	var nodes = [],
		i = 0;

	function recurse(node) {
		if (node.children) node.size = node.children.reduce(function(p, v) {
			return p + recurse(v);
		}, 0);
		if (!node.id) node.id = ++i;
		nodes.push(node);
		return node.size;
	}

	root.size = recurse(root);
	return nodes;
}

function update() {
	var nodes = flatten(root),
		links = d3.layout.tree().links(nodes);

	// Restart the force layout.
	force
		.nodes(nodes)
		.links(links)
		.start();

	// Update the links…
	link = vis.selectAll("line.link")
		.data(links, function(d) {
			return d.target.id;
		});

	// Enter any new links.
	link.enter().insert("svg:line", ".node")
		.attr("class", "link")
		.attr("x1", function(d) {
			return d.source.x;
		})
		.attr("y1", function(d) {
			return d.source.y;
		})
		.attr("x2", function(d) {
			return d.target.x;
		})
		.attr("y2", function(d) {
			return d.target.y;
		});

	// Exit any old links.
	link.exit().remove();

	// Update the nodes…
	node = vis.selectAll("circle.node")
		.data(nodes, function(d) {
			return d.id;
		})
		.style("fill", color);

	node.transition()
		.attr("r", function(d) {
			return d.children ? 4.5 : Math.sqrt(d.size) / 10;
		});

	// Enter any new nodes.
	node.enter().append("svg:circle")
		.on("click", onClick)
		.attr("class", "node")
		.attr("cx", function(d) {
			return d.x;
		})
		.attr("cy", function(d) {
			return d.y;
		})
		.attr("r", function(d) {
			return d.children ? 4.5 : Math.sqrt(d.size) / 10;
		})
		.style("fill", color)
		.call(force.drag);

	// Exit any old nodes.
	node.exit().remove();
}

function onTick() {
	link.attr("x1", function(d) {
			return d.source.x;
		})
		.attr("y1", function(d) {
			return d.source.y;
		})
		.attr("x2", function(d) {
			return d.target.x;
		})
		.attr("y2", function(d) {
			return d.target.y;
		});

	node.attr("cx", function(d) {
			return d.x;
		})
		.attr("cy", function(d) {
			return d.y;
		});
}

// Toggle children on click.
function onClick(d) {
	if (d.children) {
		d._children = d.children;
		d.children = null;
	} else {
		d.children = d._children;
		d._children = null;
	}
	update();
}

function onMouseMove() {
	fisheye.focus(d3.mouse(this));

	node.each(function(d) {
			d.fisheye = fisheye(d);
		})
		.attr("cx", function(d) {
			return d.fisheye.x;
		})
		.attr("cy", function(d) {
			return d.fisheye.y;
		})
		.attr("r", function(d) {
			return d.fisheye.z * 4.5;
		});

	link.attr("x1", function(d) {
			return d.source.fisheye.x;
		})
		.attr("y1", function(d) {
			return d.source.fisheye.y;
		})
		.attr("x2", function(d) {
			return d.target.fisheye.x;
		})
		.attr("y2", function(d) {
			return d.target.fisheye.y;
		});
}