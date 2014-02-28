/** @jsx React.DOM */
function uuid() {
    // http://www.ietf.org/rfc/rfc4122.txt
    var s = [];
    var hexDigits = "0123456789abcdef";
    for (var i = 0; i < 36; i++) {
        s[i] = hexDigits.substr(Math.floor(Math.random() * 0x10), 1);
    }
    s[14] = "4";  // bits 12-15 of the time_hi_and_version field to 0010
    s[19] = hexDigits.substr((s[19] & 0x3) | 0x8, 1);  // bits 6-7 of the clock_seq_hi_and_reserved to 01
    s[8] = s[13] = s[18] = s[23] = "-";

    var uuid = s.join("");
    return uuid;
}

/**
 * Controls component to render the + button between each block.
 * @constructor
 *
 * Once clicked, it shows a list of available block types, defined in
 * its `props`. Each option, once clicked, will trigger the handler of
 * the editor to add a new block.
 */
var ReactorControls = React.createClass({
    getInitialState: function() {
        return {display: 'none'};
    },
    showAvailableBlocks: function() {
        this.setState({display: this.state.display === 'none' ? 'block' : 'none'});
    },
    addBlock: function(e) {
        var type = e.target.text;
        this.props.onAddBlock({type: type, data: ""});
    },
    createBlockOption: function(type) {
        return (
            <a key={uuid()} href="#" onClick={this.addBlock}>
                {type}
            </a>
        )
    },
    render: function() {
        var adderStyles = {
            fontSize: "3em",
            textDecoration: "none"
        }
        return (
            <div onClick={this.showAvailableBlocks} style={{textAlign: "center"}}>
                <a href="#" style={adderStyles}>+</a>
                <div style={{display: this.state.display}}>
                    {this.props.blocks.map(this.createBlockOption)}
                </div>
            </div>
        )
    }
});

function getPos(ele){
    var x=0;
    var y=0;
    while(true){
        x += ele.offsetLeft;
        y += ele.offsetTop;
        if(ele.offsetParent === null){
            break;
        }
        ele = ele.offsetParent;
    }
    return [x, y];
}

var ReactorBlock = React.createClass({
    getInitialState: function() {
        return {isDragOver: false, isBeingDragged: false};
    },
    toData: function() {
        var block = this.refs.block;
        return (block.state || block.props).data;
    },
    handleDragStart: function(e) {
        e.dataTransfer.effectAllowed = "move";
        var blockNode = this.refs.block.getDOMNode();
        var btn = e.currentTarget.parentNode;
        var pos = getPos(btn);
        e.dataTransfer.setDragImage(blockNode, pos[0], pos[1]);
        // We store the index of the block being dragged.
        e.dataTransfer.setData('text/idx', this.props.idx);
    },
    handleDragEnter: function(e) {
        /* dispatched when another component is dragged over this component. */
        /* Most areas of a web page or application are not valid places to drop data.
        Thus, the default handling for these events is to not allow a drop.
        We prevent the default handling by cancelling the event so we can drop */
        e.preventDefault(); // Necessary. Allows us to drop.
        this.setState({isDragOver: true});
    },
    handleDragLeave: function() {
        /* dispatched when the other component is dragged outside this component. */
        this.setState({isDragOver: false});
    },
    handleDragOver: function(e) {
        /* dispatched when another component is moved inside this component. */
        /* Most areas of a web page or application are not valid places to drop data.
        Thus, the default handling for these events is to not allow a drop.
        We prevent the default handling by cancelling the event so we can drop */
        e.preventDefault(); // Necessary. Allows us to drop.
        e.dataTransfer.dropEffect = 'move';
        return false;
    },
    handleDragEnd: function() {
        this.setState({isBeingDragged: false, isDragOver: false});
    },
    handleDrop: function(e) {
        // The target block - the block being dragged onto - will receive `drop` event.
        e.stopPropagation();
        var droppeeIdx  = parseInt(e.dataTransfer.getData('text/idx'));
        this.props.onBeingDropped(droppeeIdx);
        return false;
    },
    render: function() {
        var state = this.state;
        var blockStyles = {
            opacity: state.isBeingDragged? '0.4' : '1'
        };
        var dropzoneStyles = {
            border: state.isDragOver? "2px dashed #000" : "none"
        };
        return (
            <div className="reactor-block"
                onDragStart={this.handleDragStart}
                onDragEnd={this.handleDragEnd}
                onDrop={this.handleDrop}
                onBlur={this.props.onBlur}
            >   
                <p ref='dropzone' style={dropzoneStyles}
                    onDragOver={this.handleDragOver}
                    onDragEnter={this.handleDragEnter}
                    onDragLeave={this.handleDragLeave}
                >Drop Block Here</p>
                {window[this.props.type]({
                    ref: 'block',
                    data: this.props.data,
                    style: blockStyles
                })}
                <a href="#" onClick={this.props.onDestroy}>Remove</a>
                <a href="#" draggable={true} onClick={this.displayPositioner}>Reorder</a>
            </div>
        )
    }
});

/**
 * The main component for the editor
 * @constructor
 *
 * Renders blocks based on the data provided in the DOM node's text.
 * It also renders various controls for block such as adding a new block,
 * deleting an existing block, and changing the order of blocks.
 */
var Reactor = React.createClass({
    getInitialState: function() {
        return {blocks: []};
    },
    componentWillMount: function() {
        this.setState({blocks: this.props.initialData}, function() {
            // The Editor finished rendering, focus?
        });
    },
    updateBlock: function(idx) {
        // This function is called when the user clicks outside the block.
        // It uses the block's ref to access the current data in its state.
        var block = this.refs['block-'+idx];
        var newBlocks = this.state.blocks;
        newBlocks[idx].data = block.toData();
        this.setState({blocks: newBlocks});
    },
    addBlock: function(idx, blockData) {
        var block = this.refs['block-'+idx];
        var newBlocks = this.state.blocks;
        newBlocks.splice(idx, 0, blockData);
        this.setState({blocks: newBlocks});
    },
    createBlock: function(blockData, idx) {
        return (
            <div key={uuid()} >
                <ReactorBlock 
                    ref={'block-'+idx}
                    idx={idx}
                    type={blockData.type}
                    data={blockData.data}
                    onBlur={this.updateBlock.bind(this, idx)}
                    onBeingDropped={this.swapBlock.bind(this, idx)}
                    onDestroy={this.removeBlock.bind(this, idx)}
                />
                <ReactorControls blocks={this.props.blockTypes} onAddBlock={this.addBlock.bind(this, idx+1)} />
            </div>
        );
    },
    swapBlock: function(targetIdx, sourceIdx) {
        if (sourceIdx === targetIdx) return;
        var blocks = this.state.blocks;
        var temp = blocks[sourceIdx];
        blocks[sourceIdx] = blocks[targetIdx];
        blocks[targetIdx] = temp;
        this.setState({blocks: blocks});
    },
    removeBlock: function(idx) {
        var newBlocks = this.state.blocks;
        newBlocks.splice(idx, 1);
        this.setState({blocks: newBlocks});
    },
    render: function() {
        return (
            <div className="reactor">
                <ReactorControls blocks={this.props.blockTypes} onAddBlock={this.addBlock.bind(this, 0)}/>
                {this.state.blocks.map(this.createBlock)}
            </div>
        );
    }
});

// Support touch on mobile devices.
React.initializeTouchEvents(true);

var entry = document.getElementById('markdown-entry');
var initialData = [{type:"Text", data: entry.value}];
var reactor = document.createElement("div");
entry.parentNode.insertBefore(reactor, entry);
entry.style.display = "none";

React.renderComponent(
    <Reactor initialData={initialData} blockTypes={["Text", "Image"]}/>, 
    reactor
);