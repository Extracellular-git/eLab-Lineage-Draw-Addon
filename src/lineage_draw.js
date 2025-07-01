/*
@rootVar: EC_LINEAGE_DRAW
@name: Lineage Draw add-on
@version: 1.0.0 
@description: Extracellular Lineage add-on for eLab
@requiredElabVersion: 2.35.0
@author: Extracellular
*/

/*!
 * © 2025 Extracellular — released under the MIT License
 * See LICENSE file for details.
 */

var EC_LINEAGE_DRAW = {};

(function (context) {
    context.init = function (data) {
        // Add a custom tab to the sample detail page using the SDK
        eLabSDK2.Inventory.Sample.SampleDetail.addTab({
            id: 'lineage-draw-tab',
            title: 'Lineage Draw',
            type: 'custom',
            content: context.renderLineageContent()
        });

        // Wait for sample detail to be ready, then initialise
        eLabSDK2.Inventory.Sample.SampleDetail.onSampleDetailReady(() => {
            console.log('Sample detail ready, initializing lineage functionality');
            context.initialiseLineageTab();
        }, 'lineage-draw-ready');
    };

    // Function to render the tab content HTML
    context.renderLineageContent = function() {
        return `
            <div class="lineage-tab-container" style="padding: 20px;">
                <div class="lineage-header" style="margin-bottom: 20px;">
                    <h3 style="color: #333; margin-bottom: 10px;">Sample Lineage Visualization</h3>
                    <p style="color: #666; font-size: 14px;">
                        Visualise sample ancestry and lineage relationships with detailed information about storage locations and creation dates.
                    </p>
                </div>

                <div class="lineage-canvas-section" style="background: white; border: 1px solid #e0e0e0; border-radius: 8px; padding: 20px; margin-bottom: 20px;">
                    <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px;">
                        <h4 style="margin: 0; color: #333;">Lineage Tree</h4>
                        <div class="lineage-controls" style="display: flex; gap: 10px;">
                            <button id="generate-lineage-btn" class="hx-button hx-button-primary" type="button">
                                Generate Lineage
                            </button>
                            <button id="clear-canvas-btn" class="hx-button hx-button-secondary" type="button">
                                Clear
                            </button>
                            <button id="export-png-btn" class="hx-button hx-button-secondary" type="button">
                                Export PNG
                            </button>
                        </div>
                    </div>
                    
                    <div id="lineage-canvas-container" style="
                        border: 1px solid #ccc; 
                        min-height: 400px; 
                        background: #f9f9f9; 
                        display: flex; 
                        align-items: center; 
                        justify-content: center; 
                        overflow: auto;
                        border-radius: 4px;
                    ">
                        <canvas 
                            id="lineage-canvas" 
                            width="800" 
                            height="400" 
                            style="border: 1px solid #ddd; background: white; max-width: 100%;"
                        ></canvas>
                    </div>
                </div>

                <div class="lineage-info-section" style="background: #f8f9fa; border: 1px solid #e0e0e0; border-radius: 8px; padding: 15px;">
                    <h4 style="margin-top: 0; color: #333;">Sample Information</h4>
                    <div id="sample-info-content" style="color: #666;">
                        <p><em>Loading sample data...</em></p>
                    </div>
                </div>
            </div>

            <style>
                .hx-button {
                    font-family: inherit;
                    font-size: 14px;
                    font-weight: 500;
                    line-height: 1.4;
                    border-radius: 4px;
                    border: 1px solid transparent;
                    padding: 8px 16px;
                    cursor: pointer;
                    transition: all 0.2s ease;
                    text-decoration: none;
                    display: inline-flex;
                    align-items: center;
                    justify-content: center;
                    min-height: 36px;
                }

                .hx-button:disabled {
                    opacity: 0.6;
                    cursor: not-allowed;
                }

                .hx-button-primary {
                    background-color: #08a0a1;
                    color: white;
                    border-color: #08a0a1;
                }

                .hx-button-primary:hover:not(:disabled) {
                    background-color: #067576;
                    border-color: #067576;
                }

                .hx-button-secondary {
                    background-color: transparent;
                    color: #08a0a1;
                    border-color: #08a0a1;
                }

                .hx-button-secondary:hover:not(:disabled) {
                    background-color: #08a0a1;
                    color: white;
                }

                #lineage-canvas-container {
                    min-height: 400px;
                    overflow: auto;
                    resize: both;
                }

                #lineage-canvas {
                    border-radius: 4px;
                    max-width: 100%;
                    height: auto;
                }
            </style>
        `;
    };

    // wait for the tab DOM elements to be ready
    context.waitForTabDOM = function(callback) {
        const checkDOMReady = () => {
            const generateBtn = document.getElementById('generate-lineage-btn');
            const sampleInfo = document.getElementById('sample-info-content');
            const canvas = document.getElementById('lineage-canvas');
            
            if (generateBtn && sampleInfo && canvas) {
                // All required elements are ready
                callback();
            } else {
                // Elements not ready yet, retry after a short delay
                console.log('Tab DOM elements not ready yet, retrying...');
                setTimeout(checkDOMReady, 100);
            }
        };
        
        checkDOMReady();
    };

    // initialise the tab after the sample detail is ready
    context.initialiseLineageTab = function() {
        // Wait for the DOM to be ready before proceeding
        context.waitForTabDOM(() => {
            // Get the current sample ID from the SDK
            const sampleID = eLabSDK2.Inventory.Sample.SampleDetail.getSampleID();
            
            if (sampleID) {
                console.log('Initializing lineage for sample ID:', sampleID);
                // Automatically load the current sample data
                context.loadSampleData(sampleID);
            } else {
                console.log('No sample ID found');
                const sampleInfo = document.getElementById('sample-info-content');
                if (sampleInfo) {
                    sampleInfo.innerHTML = '<p><em>No sample loaded.</em></p>';
                }
            }

            // Set up event handlers
            context.setupEventHandlers();
        });
    };

    // Function to set up all event handlers
    context.setupEventHandlers = function() {
        const generateBtn = document.getElementById('generate-lineage-btn');
        const clearBtn = document.getElementById('clear-canvas-btn');
        const exportBtn = document.getElementById('export-png-btn');

        // Generate lineage button
        if (generateBtn) {
            generateBtn.onclick = () => {
                if (context.lineageData) {
                    // Call without context, function will handle DOM readiness
                    context.drawSampleLineage();
                } else {
                    // Try to reload the sample data if not available
                    const sampleID = eLabSDK2.Inventory.Sample.SampleDetail.getSampleID();
                    if (sampleID) {
                        context.loadSampleData(sampleID);
                    }
                }
            };
        }

        // Clear canvas button
        if (clearBtn) {
            clearBtn.onclick = () => {
                const canvas = document.getElementById('lineage-canvas');
                if (canvas) {
                    const ctx = canvas.getContext('2d');
                    ctx.clearRect(0, 0, canvas.width, canvas.height);
                } else {
                    console.log('Canvas element not found for clearing');
                }
            };
        }

        // Export PNG button
        if (exportBtn) {
            exportBtn.onclick = () => {
                const canvas = document.getElementById('lineage-canvas');
                if (canvas) {
                    context.exportLineageAsImage(canvas);
                } else {
                    console.log('Canvas element not found for export');
                }
            };
        }
    };

    // Function to load sample data and lineage
    context.loadSampleData = async function(sampleID) {
        try {
            // Show loading state
            const generateBtn = document.getElementById('generate-lineage-btn');
            const sampleInfo = document.getElementById('sample-info-content');
            
            if (generateBtn) {
                generateBtn.disabled = true;
                generateBtn.textContent = 'Loading...';
            }
            if (sampleInfo) {
                sampleInfo.innerHTML = '<p><em>Loading sample data...</em></p>';
            }

            console.log('Fetching data for sample ID:', sampleID);
            
            // Fetch sample data, parents, and children from API calls and wait for it all to be done
            // sampleData is used to display current sample information
            // parentsData is used to build the lineage chain
            // childrenData is used to display children samples
            const [sampleData, parentsData, childrenData] = await Promise.all([
                context.api_call({
                    method: 'GET',
                    path: 'samples/{sampleID}',
                    pathParams: { sampleID: sampleID }
                }),
                context.api_call({
                    method: 'GET',
                    path: 'samples/{sampleID}/parents',
                    pathParams: { sampleID: sampleID }
                }).catch(err => {
                    console.log('No parents found or error fetching parents:', err);
                    return [];
                }),
                context.api_call({
                    method: 'GET',
                    path: 'samples/{sampleID}/children',
                    pathParams: { sampleID: sampleID }
                }).catch(err => {
                    console.log('No children found or error fetching children:', err);
                    return { data: [] };
                })
            ]);

            console.log('Sample data:', sampleData);
            console.log('Parents data:', parentsData);
            console.log('Children data:', childrenData);

            // Process parent chain from parentsData and put it in the right order
            // We have to hadle a couple of formats:
            // 1. Array format - use directly
            // 2. Single parent object - this is the direct parent <- happens when there is only one parent
            // 3. Object with nested parent structure - traverse parent.parent <- so we get a full lineage chain
            let parentChain = [];
            if (parentsData) {
                if (Array.isArray(parentsData)) {
                    // Array format
                    parentChain = parentsData;
                } else if (parentsData.sampleID) {
                    // Single parent object
                    parentChain = [parentsData];
                    
                    // Check if there are nested parents (parent.parent structure)
                    if (parentsData.parent) {
                        let current = parentsData.parent;
                        while (current && current.sampleID) {
                            parentChain.unshift(current); // Add to beginning (oldest first)
                            current = current.parent;
                        }
                    }
                } else if (parentsData.parent) {
                    // Object with nested parent structure but no direct sampleID
                    let current = parentsData;
                    while (current && current.parent) {
                        parentChain.push(current.parent);
                        current = current.parent;
                    }
                    // Reverse to get oldest first
                    parentChain.reverse();
                }
            }

            // Fetch storage information for all samples
            // optional chaining for childrenData to handle undefined, if undefined, use empty array 
            const allSamples = [sampleData, ...parentChain, ...(childrenData?.data || [])];
            const storagePromises = allSamples
                .filter(sample => sample.storageLayerID && sample.storageLayerID > 0)
                .map(sample => 
                    context.api_call({
                        method: 'GET',
                        path: 'storageLayers/{storageLayerID}',
                        pathParams: { storageLayerID: sample.storageLayerID }
                    }).then(storageData => ({
                        sampleID: sample.sampleID,
                        storageData: storageData
                    })).catch(err => {
                        console.log(`Error fetching storage for sample ${sample.sampleID}:`, err);
                        return { sampleID: sample.sampleID, storageData: null };
                    })
                );

            const storageResults = await Promise.all(storagePromises);
            
            // Create storage map
            // This will map sampleID to its storage data - {sampleID: storageData}
            const storageMap = {};
            storageResults.forEach(result => {
                storageMap[result.sampleID] = result.storageData;
            });

            // Store lineage data to display
            context.lineageData = {
                currentSample: sampleData,
                parentChain: parentChain,
                children: childrenData?.data || [],
                storageMap: storageMap
            };

            // Update UI
            context.updateSampleInfo(sampleData, parentChain, childrenData?.data || []);
            
            if (generateBtn) {
                generateBtn.disabled = false;
                generateBtn.textContent = 'Generate Lineage';
            }

            console.log('Sample data loaded successfully');

        } catch (error) {
            console.error('Error loading sample data:', error);
            
            const generateBtn = document.getElementById('generate-lineage-btn');
            const sampleInfo = document.getElementById('sample-info-content');
            
            if (generateBtn) {
                generateBtn.disabled = true;
                generateBtn.textContent = 'Generate Lineage';
            }
            if (sampleInfo) {
                sampleInfo.innerHTML = `<p style="color: #d73027;"><strong>Error:</strong> ${error.error || error.message || 'Failed to load sample data'}</p>`;
            }
        }
    };

    // Function to update sample information display
    context.updateSampleInfo = function(sampleData, parentChain, children) {
        // Wait for DOM element to be available
        const updateInfo = () => {
            const sampleInfo = document.getElementById('sample-info-content');
            if (!sampleInfo) {
                console.log('sample-info-content element not found, retrying...');
                setTimeout(updateInfo, 100);
                return;
            }
            
            const createdDate = new Date(sampleData.created).toLocaleDateString();
            
            const html = `
                <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(250px, 1fr)); gap: 20px;">
                    <div>
                        <h4 style="margin: 0 0 10px 0; color: #333;">Sample Details</h4>
                        <p><strong>Name:</strong> ${sampleData.name || 'Unknown'}</p>
                        <p><strong>ID:</strong> ${sampleData.sampleID}</p>
                        <p><strong>Type:</strong> ${sampleData.sampleType?.name || 'Unknown'}</p>
                        <p><strong>Created:</strong> ${createdDate}</p>
                        <p><strong>Owner:</strong> ${sampleData.owner || 'Unknown'}</p>
                    </div>
                    <div>
                        <h4 style="margin: 0 0 10px 0; color: #333;">Lineage Summary</h4>
                        <p><strong>Parents:</strong> ${parentChain.length}</p>
                        <p><strong>Children:</strong> ${children.length}</p>
                        <p><strong>Total Lineage:</strong> ${parentChain.length + 1 + children.length} samples</p>
                        <p><strong>Storage:</strong> ${context.lineageData?.storageMap[sampleData.sampleID]?.name || 'No storage assigned'}</p>
                    </div>
                </div>
            `;
            
            sampleInfo.innerHTML = html;
        };
        
        updateInfo();
    };

    // Wrap eLabSDK.API.Call in a promise for async/await
    context.api_call = function(opts) {
        return new Promise((resolve, reject) => {
            eLabSDK.API.call(Object.assign({}, opts, {
                onSuccess: (xhr, status, resp) => {
                    if (xhr && xhr.status && (xhr.status < 200 || xhr.status >= 300)) {
                        reject({ error: `HTTP error ${xhr.status}`, xhr, resp });
                    } else {
                        resolve(resp);
                    }
                },
                onError: (xhr, status, error) => reject({ error, xhr, status })
            }));
        });
    };

    // Function to draw the sample lineage (copied from original with improvements)
    context.drawSampleLineage = function(ctx) {
        // Wait for canvas element to be available if context is not provided
        if (!ctx) {
            const drawWithContext = () => {
                const canvas = document.getElementById('lineage-canvas');
                if (!canvas) {
                    console.log('lineage-canvas element not found, retrying...');
                    setTimeout(drawWithContext, 100);
                    return;
                }
                
                const context2d = canvas.getContext('2d');
                context.drawSampleLineage(context2d);
            };
            
            drawWithContext();
            return;
        }
        
        if (!context.lineageData) {
            console.error('No lineage data available');
            return;
        }

        const { currentSample, parentChain, children, storageMap } = context.lineageData;
        
        // Calculate dynamic canvas size based on content
        const nodeWidth = 200;
        const nodeHeight = 100;
        const verticalSpacing = 140;
        const horizontalSpacing = 250;
        const padding = 150;
        
        // Calculate required dimensions
        const parentLevels = parentChain ? parentChain.length : 0;
        const currentLevel = 1;
        const childLevels = (children && children.length > 0) ? 1 : 0;
        const totalLevels = parentLevels + currentLevel + childLevels;
        
        const maxChildrenWidth = children && children.length > 0 ? children.length : 1;
        
        const childrenWidth = maxChildrenWidth > 1 ? 
            ((maxChildrenWidth - 1) * horizontalSpacing) + nodeWidth : 
            nodeWidth;
        
        const requiredWidth = Math.max(
            nodeWidth + (2 * padding),
            childrenWidth + (2 * padding)
        );
        
        const requiredHeight = (totalLevels * verticalSpacing) + (2 * padding);
        
        // Resize canvas dynamically
        const canvas = ctx.canvas;
        canvas.width = Math.max(800, requiredWidth);
        canvas.height = Math.max(400, requiredHeight);
        
        // Update canvas container
        const canvasContainer = document.getElementById('lineage-canvas-container');
        if (canvasContainer) {
            canvasContainer.style.minHeight = `${canvas.height + 40}px`;
            canvasContainer.style.minWidth = `${canvas.width + 40}px`;
        }
        
        // Clear canvas
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        
        // Set up drawing context
        const centerX = canvas.width / 2;
        
        // Calculate vertical positioning
        let currentStartY;
        if (parentChain.length === 0) {
            const totalVerticalSpace = childLevels > 0 ? verticalSpacing : 0;
            currentStartY = padding + (nodeHeight / 2) + (canvas.height - 2 * padding - totalVerticalSpace - nodeHeight) / 3;
        } else {
            const totalTreeHeight = (totalLevels - 1) * verticalSpacing;
            const availableSpace = canvas.height - (2 * padding) - nodeHeight;
            const topMargin = Math.max(padding, (availableSpace - totalTreeHeight) / 4);
            currentStartY = topMargin + (nodeHeight / 2) + (parentChain.length * verticalSpacing);
        }

        // Set drawing styles
        ctx.font = '12px Arial';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';

        // Calculate positions for all nodes
        let positions = {};

        // Draw parents
        if (parentChain && parentChain.length > 0) {
            parentChain.forEach((parent, index) => {
                const y = currentStartY - (verticalSpacing * (parentChain.length - index));
                positions[parent.sampleID] = { x: centerX, y: y };
                context.drawSampleNode(ctx, parent, centerX, y, nodeWidth, nodeHeight, '#4CAF50', 'Parent', storageMap);
            });
        }

        // Draw current sample
        positions[currentSample.sampleID] = { x: centerX, y: currentStartY };
        context.drawSampleNode(ctx, currentSample, centerX, currentStartY, nodeWidth, nodeHeight, '#2196F3', 'Current', storageMap);

        // Draw children
        if (children && children.length > 0) {
            const childY = currentStartY + verticalSpacing;
            const totalChildrenWidth = (children.length - 1) * horizontalSpacing;
            const startX = centerX - (totalChildrenWidth / 2);

            children.forEach((child, index) => {
                const x = startX + (index * horizontalSpacing);
                positions[child.sampleID] = { x: x, y: childY };
                context.drawSampleNode(ctx, child, x, childY, nodeWidth, nodeHeight, '#FF9800', 'Child', storageMap);
            });
        }

        // Draw connections
        context.drawConnections(ctx, positions, currentSample, parentChain, children, nodeHeight);

        // Add legend and timestamp
        context.addLegendAndTimestamp(ctx, canvas);
    };

    // Function to draw a single sample node
    context.drawSampleNode = function(ctx, sample, x, y, width, height, color, type, storageMap) {
        const cornerRadius = 8;
        
        // Draw rounded rectangle
        ctx.fillStyle = color;
        ctx.beginPath();
        ctx.roundRect(x - width/2, y - height/2, width, height, cornerRadius);
        ctx.fill();
        
        // Add border
        ctx.strokeStyle = '#333';
        ctx.lineWidth = 2;
        ctx.stroke();
        
        // Draw sample type indicator
        if (sample.sampleType && sample.sampleType.backgroundColor) {
            ctx.fillStyle = `#${sample.sampleType.backgroundColor}`;
            ctx.beginPath();
            ctx.arc(x - width/2 + 15, y - height/2 + 15, 8, 0, 2 * Math.PI);
            ctx.fill();
        }
        
        // Draw text
        ctx.fillStyle = '#fff';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        
        // Sample name
        ctx.font = 'bold 12px Arial';
        let displayName = sample.name;
        if (displayName.length > 20) {
            displayName = displayName.substring(0, 17) + '...';
        }
        ctx.fillText(displayName, x, y - 24);
        
        // Creation date
        ctx.font = '9px Arial';
        ctx.fillStyle = 'rgba(255, 255, 255, 0.8)';
        const createdDate = new Date(sample.created);
        ctx.fillText(createdDate.toLocaleDateString(), x, y - 8);
        
        // Storage information
        const storageData = storageMap && storageMap[sample.sampleID];
        if (storageData && storageData.name) {
            ctx.font = '9px Arial';
            ctx.fillStyle = 'rgba(255, 255, 255, 0.8)';
            let storageName = storageData.name;
            if (storageName.length > 18) {
                storageName = storageName.substring(0, 15) + '...';
            }
            ctx.fillText(`📦 ${storageName}`, x, y + 4);
            
            if (sample.position !== undefined && sample.position >= 0) {
                ctx.font = '8px Arial';
                ctx.fillStyle = 'rgba(255, 255, 255, 0.7)';
                ctx.fillText(`Pos: ${sample.position}`, x, y + 16);
            }
        } else {
            ctx.font = '9px Arial';
            ctx.fillStyle = 'rgba(255, 255, 255, 0.6)';
            ctx.fillText('No Storage', x, y + 4);
        }
        
        // Type label and Sample ID in bottom corners
        ctx.font = '8px Arial';
        ctx.fillStyle = 'rgba(255, 255, 255, 0.5)';
        ctx.textAlign = 'left';
        ctx.fillText(type, x - width/2 + 8, y + height/2 - 8);
        
        ctx.textAlign = 'right';
        ctx.fillText(`ID: ${sample.sampleID}`, x + width/2 - 8, y + height/2 - 8);
    };

    // Function to draw connections between nodes
    context.drawConnections = function(ctx, positions, currentSample, parentChain, children, nodeHeight) {
        ctx.strokeStyle = '#666';
        ctx.lineWidth = 2;
        
        const currentPos = positions[currentSample.sampleID];
        const halfNodeHeight = nodeHeight / 2;
        
        // Draw connections between parents
        if (parentChain && parentChain.length > 0) {
            for (let i = 0; i < parentChain.length - 1; i++) {
                const parentPos = positions[parentChain[i].sampleID];
                const childPos = positions[parentChain[i + 1].sampleID];
                
                if (parentPos && childPos) {
                    ctx.beginPath();
                    ctx.moveTo(parentPos.x, parentPos.y + halfNodeHeight);
                    ctx.lineTo(childPos.x, childPos.y - halfNodeHeight);
                    ctx.stroke();
                    
                    context.drawArrow(ctx, parentPos.x, parentPos.y + halfNodeHeight, childPos.x, childPos.y - halfNodeHeight);
                }
            }
            
            // Connect newest parent to current sample
            const newestParent = parentChain[parentChain.length - 1];
            const newestParentPos = positions[newestParent.sampleID];
            
            if (newestParentPos && currentPos) {
                ctx.beginPath();
                ctx.moveTo(newestParentPos.x, newestParentPos.y + halfNodeHeight);
                ctx.lineTo(currentPos.x, currentPos.y - halfNodeHeight);
                ctx.stroke();
                
                context.drawArrow(ctx, newestParentPos.x, newestParentPos.y + halfNodeHeight, currentPos.x, currentPos.y - halfNodeHeight);
            }
        }
        
        // Draw connections to children
        if (children && children.length > 0) {
            children.forEach(child => {
                const childPos = positions[child.sampleID];
                if (childPos && currentPos) {
                    ctx.beginPath();
                    ctx.moveTo(currentPos.x, currentPos.y + halfNodeHeight);
                    ctx.lineTo(childPos.x, childPos.y - halfNodeHeight);
                    ctx.stroke();
                    
                    context.drawArrow(ctx, currentPos.x, currentPos.y + halfNodeHeight, childPos.x, childPos.y - halfNodeHeight);
                }
            });
        }
    };

    // Function to draw an arrow
    context.drawArrow = function(ctx, fromX, fromY, toX, toY) {
        const headlen = 8;
        const angle = Math.atan2(toY - fromY, toX - fromX);
        
        ctx.beginPath();
        ctx.moveTo(toX - headlen * Math.cos(angle - Math.PI / 6), toY - headlen * Math.sin(angle - Math.PI / 6));
        ctx.lineTo(toX, toY);
        ctx.lineTo(toX - headlen * Math.cos(angle + Math.PI / 6), toY - headlen * Math.sin(angle + Math.PI / 6));
        ctx.stroke();
    };

    // Function to add legend and timestamp
    context.addLegendAndTimestamp = function(ctx, canvas) {
        const legendX = 20;
        const legendY = 20;
        
        ctx.font = '10px Arial';
        ctx.textAlign = 'left';
        ctx.fillStyle = '#666';
        ctx.fillText('Legend:', legendX, legendY);
        
        // Parent color
        ctx.fillStyle = '#4CAF50';
        ctx.fillRect(legendX, legendY + 10, 12, 12);
        ctx.fillStyle = '#666';
        ctx.fillText('Parent', legendX + 20, legendY + 16);
        
        // Current color
        ctx.fillStyle = '#2196F3';
        ctx.fillRect(legendX, legendY + 30, 12, 12);
        ctx.fillStyle = '#666';
        ctx.fillText('Current', legendX + 20, legendY + 36);
        
        // Child color
        ctx.fillStyle = '#FF9800';
        ctx.fillRect(legendX, legendY + 50, 12, 12);
        ctx.fillStyle = '#666';
        ctx.fillText('Child', legendX + 20, legendY + 56);
        
        // Add timestamp
        ctx.font = '10px Arial';
        ctx.textAlign = 'right';
        ctx.fillStyle = '#666';
        ctx.fillText('Generated: ' + new Date().toLocaleString(), canvas.width - 10, canvas.height - 10);
    };

    // Function to export lineage as PNG
    context.exportLineageAsImage = function(canvas) {
        const link = document.createElement('a');
        link.download = 'sample-lineage.png';
        link.href = canvas.toDataURL();
        link.click();
    };

})(EC_LINEAGE_DRAW);


