// Get all DOM elements
const shaderTypeSelect = document.getElementById('shader-type');
const contentTypeRadios = document.querySelectorAll('input[name="content-type"]');
const fontTypeRadios = document.querySelectorAll('input[name="font-type"]');
const textInputSection = document.getElementById('text-input-section');
const ljNumbersSection = document.getElementById('lj-numbers-section');
const standardFontSection = document.getElementById('standard-font-section');
const customFontSection = document.getElementById('custom-font-section');
const textInput = document.getElementById('text-input');
const minNumberInput = document.getElementById('min-number');
const maxNumberInput = document.getElementById('max-number');
const incrementInput = document.getElementById('increment');
const alignmentSelect = document.getElementById('alignment');
const fontSelect = document.getElementById('font-select');
const fontSizeSlider = document.getElementById('font-size-slider');
const fontSizeValue = document.getElementById('font-size-value');
const resolutionSelect = document.getElementById('resolution');
const previewCanvas = document.getElementById('preview-canvas');
const generateBtn = document.getElementById('generate-btn');
const addToQueueBtn = document.getElementById('add-to-queue-btn');
const clearQueueBtn = document.getElementById('clear-queue-btn');
const downloadQueueBtn = document.getElementById('download-queue-btn');
const queueSection = document.getElementById('queue-section');
const queueList = document.getElementById('queue-list');
const queueCount = document.getElementById('queue-count');
const progressSection = document.getElementById('progress-section');
const progressFill = document.getElementById('progress-fill');
const statusText = document.getElementById('status-text');
const fontUploadInput = document.getElementById('font-upload');
const uploadedFontsDiv = document.getElementById('uploaded-fonts');

// Store uploaded fonts
const uploadedFonts = new Map(); // fontName -> { fontFace, file }

// Store queue items
const queue = [];

// Event listeners
contentTypeRadios.forEach(radio => {
    radio.addEventListener('change', updateContentTypeVisibility);
});

fontTypeRadios.forEach(radio => {
    radio.addEventListener('change', updateFontTypeVisibility);
});

textInput.addEventListener('input', updatePreview);
minNumberInput.addEventListener('input', updatePreview);
maxNumberInput.addEventListener('input', updatePreview);
alignmentSelect.addEventListener('change', updatePreview);
fontSelect.addEventListener('change', updatePreview);
fontSizeSlider.addEventListener('input', () => {
    fontSizeValue.textContent = fontSizeSlider.value;
    updatePreview();
});
fontUploadInput.addEventListener('change', handleFontUpload);
generateBtn.addEventListener('click', generateAndDownload);
addToQueueBtn.addEventListener('click', addToQueue);
clearQueueBtn.addEventListener('click', clearQueue);
downloadQueueBtn.addEventListener('click', downloadQueue);

// Initialize
updateContentTypeVisibility();
updateFontTypeVisibility();
updatePreview();

function updateContentTypeVisibility() {
    const selectedType = document.querySelector('input[name="content-type"]:checked').value;
    
    if (selectedType === 'text') {
        textInputSection.style.display = 'block';
        ljNumbersSection.style.display = 'none';
    } else {
        textInputSection.style.display = 'none';
        ljNumbersSection.style.display = 'block';
    }
    
    updatePreview();
}

function updateFontTypeVisibility() {
    const selectedType = document.querySelector('input[name="font-type"]:checked').value;
    
    if (selectedType === 'standard') {
        standardFontSection.style.display = 'block';
        customFontSection.style.display = 'none';
    } else {
        standardFontSection.style.display = 'none';
        customFontSection.style.display = 'block';
    }
    
    updatePreview();
}

async function handleFontUpload(event) {
    const files = event.target.files;
    
    for (let file of files) {
        try {
            // Read font file
            const arrayBuffer = await file.arrayBuffer();
            
            // Extract font name (remove extension)
            const fontName = file.name.replace(/\.(ttf|otf|woff|woff2)$/i, '');
            
            // Create FontFace
            const fontFace = new FontFace(fontName, arrayBuffer);
            
            // Load the font
            await fontFace.load();
            
            // Add to document fonts
            document.fonts.add(fontFace);
            
            // Store in our map
            uploadedFonts.set(fontName, { fontFace, file });
            
            // Add to dropdown
            const option = document.createElement('option');
            option.value = fontName;
            option.textContent = `${fontName} (uploaded)`;
            fontSelect.insertBefore(option, fontSelect.firstChild);
            
            // Select the newly uploaded font
            fontSelect.value = fontName;
            
            // Add badge
            addFontBadge(fontName);
            
            // Update preview
            updatePreview();
            
        } catch (error) {
            console.error(`Error loading font ${file.name}:`, error);
            alert(`Failed to load font ${file.name}. Make sure it's a valid font file.`);
        }
    }
    
    // Clear the input
    event.target.value = '';
}

function addFontBadge(fontName) {
    const badge = document.createElement('div');
    badge.className = 'font-badge';
    badge.innerHTML = `
        <span>${fontName}</span>
        <span class="font-badge-remove" data-font="${fontName}">×</span>
    `;
    
    badge.querySelector('.font-badge-remove').addEventListener('click', () => {
        removeFontUpload(fontName);
    });
    
    uploadedFontsDiv.appendChild(badge);
}

function removeFontUpload(fontName) {
    // Remove from map
    const fontData = uploadedFonts.get(fontName);
    if (fontData) {
        document.fonts.delete(fontData.fontFace);
        uploadedFonts.delete(fontName);
    }
    
    // Remove from dropdown
    const options = fontSelect.querySelectorAll('option');
    options.forEach(option => {
        if (option.value === fontName) {
            option.remove();
        }
    });
    
    // Remove badge
    const badges = uploadedFontsDiv.querySelectorAll('.font-badge');
    badges.forEach(badge => {
        const removeBtn = badge.querySelector('.font-badge-remove');
        if (removeBtn && removeBtn.dataset.font === fontName) {
            badge.remove();
        }
    });
    
    // If this was the selected font, switch to Arial
    if (fontSelect.value === fontName) {
        fontSelect.value = 'Arial';
        updatePreview();
    }
}

function updatePreview() {
    const canvas = previewCanvas;
    const ctx = canvas.getContext('2d');
    const size = 300;
    canvas.width = size;
    canvas.height = size;
    
    // Clear canvas
    ctx.fillStyle = '#000000';
    ctx.fillRect(0, 0, size, size);
    
    // Get text based on content type
    const contentType = document.querySelector('input[name="content-type"]:checked').value;
    let text;
    
    if (contentType === 'lj-numbers') {
        // Show the minimum number as preview
        const minNum = parseInt(minNumberInput.value) || 0;
        text = minNum.toString();
    } else {
        text = textInput.value;
        if (!text.trim()) {
            text = 'Sample';
        }
    }
    
    // Split text into lines
    const lines = text.split('\n');
    
    // Get font and alignment
    const fontFamily = fontSelect.value;
    const alignment = alignmentSelect.value;
    const fontSizeScale = parseInt(fontSizeSlider.value) / 100;
    
    // Calculate base font size based on canvas size and number of lines
    const lineCount = lines.length;
    let baseFontSize = size / 4;
    
    // Adjust base size for multiple lines to prevent excessive shrinking
    if (lineCount > 1) {
        baseFontSize = Math.min(size / 4, size / (lineCount * 0.8));
    }
    
    // First, calculate what the fitted font size would be at 100%
    let fittedFontSize = baseFontSize;
    ctx.font = `bold ${fittedFontSize}px "${fontFamily}"`;
    
    // Measure and adjust to fit
    let maxWidth = 0;
    for (const line of lines) {
        const metrics = ctx.measureText(line);
        if (metrics.width > maxWidth) maxWidth = metrics.width;
    }
    
    let lineHeight = fittedFontSize * 1.2;
    let totalHeight = lineHeight * lines.length;
    
    while ((maxWidth > size * 0.9 || totalHeight > size * 0.9) && fittedFontSize > 10) {
        fittedFontSize -= 2;
        ctx.font = `bold ${fittedFontSize}px "${fontFamily}"`;
        maxWidth = 0;
        for (const line of lines) {
            const metrics = ctx.measureText(line);
            if (metrics.width > maxWidth) maxWidth = metrics.width;
        }
        lineHeight = fittedFontSize * 1.2;
        totalHeight = lineHeight * lines.length;
    }
    
    // Now apply the scale to the fitted size
    const fontSize = fittedFontSize * fontSizeScale;
    ctx.font = `bold ${fontSize}px "${fontFamily}"`;
    lineHeight = fontSize * 1.2;
    
    // Set text properties
    ctx.fillStyle = '#FFFFFF';
    ctx.textBaseline = 'middle';
    
    // Set alignment
    let x;
    if (alignment === 'left') {
        ctx.textAlign = 'left';
        x = size * 0.05;
    } else if (alignment === 'right') {
        ctx.textAlign = 'right';
        x = size * 0.95;
    } else {
        ctx.textAlign = 'center';
        x = size / 2;
    }
    
    // Draw each line
    const totalTextHeight = lineHeight * lines.length;
    let y = (size - totalTextHeight) / 2 + lineHeight / 2;
    
    for (const line of lines) {
        ctx.fillText(line, x, y);
        y += lineHeight;
    }
}

async function generateAndDownload() {
    // Validate inputs
    const contentType = document.querySelector('input[name="content-type"]:checked').value;
    
    if (contentType === 'text' && !textInput.value.trim()) {
        alert('Please enter text to generate.');
        return;
    }
    
    if (contentType === 'lj-numbers') {
        const min = parseInt(minNumberInput.value);
        const max = parseInt(maxNumberInput.value);
        
        if (min >= max) {
            alert('Maximum number must be greater than minimum number.');
            return;
        }
    }
    
    // Disable button and show progress
    generateBtn.disabled = true;
    progressSection.style.display = 'block';
    progressFill.style.width = '0%';
    statusText.textContent = 'Preparing...';
    
    try {
        await generateFiles();
        statusText.textContent = 'Download complete!';
        setTimeout(() => {
            progressSection.style.display = 'none';
        }, 2000);
    } catch (error) {
        alert(`Error: ${error.message}`);
        statusText.textContent = 'Error occurred';
    } finally {
        generateBtn.disabled = false;
    }
}

function addToQueue() {
    // Validate inputs
    const contentType = document.querySelector('input[name="content-type"]:checked').value;
    
    if (contentType === 'text' && !textInput.value.trim()) {
        alert('Please enter text to generate.');
        return;
    }
    
    if (contentType === 'lj-numbers') {
        const min = parseInt(minNumberInput.value);
        const max = parseInt(maxNumberInput.value);
        
        if (min >= max) {
            alert('Maximum number must be greater than minimum number.');
            return;
        }
    }
    
    // Create queue item
    const queueItem = {
        id: Date.now(),
        contentType,
        text: contentType === 'text' ? textInput.value : null,
        minNumber: contentType === 'lj-numbers' ? parseInt(minNumberInput.value) : null,
        maxNumber: contentType === 'lj-numbers' ? parseInt(maxNumberInput.value) : null,
        increment: contentType === 'lj-numbers' ? parseInt(incrementInput.value) : null,
        shaderType: shaderTypeSelect.value,
        resolution: parseInt(resolutionSelect.value),
        fontFamily: fontSelect.value,
        alignment: alignmentSelect.value,
        fontSizeScale: parseInt(fontSizeSlider.value),
        folderName: 'fuckpointworldtext'
    };
    
    queue.push(queueItem);
    updateQueueDisplay();
}

function clearQueue() {
    queue.length = 0;
    updateQueueDisplay();
}

function removeFromQueue(id) {
    const index = queue.findIndex(item => item.id === id);
    if (index !== -1) {
        queue.splice(index, 1);
        updateQueueDisplay();
    }
}

function updateQueueDisplay() {
    if (queue.length === 0) {
        queueSection.style.display = 'none';
        return;
    }
    
    queueSection.style.display = 'block';
    queueCount.textContent = queue.length;
    
    queueList.innerHTML = '';
    queue.forEach(item => {
        const queueItemEl = document.createElement('div');
        queueItemEl.className = 'queue-item';
        
        let displayText;
        if (item.contentType === 'text') {
            displayText = item.text.length > 30 ? item.text.substring(0, 30) + '...' : item.text;
        } else {
            const count = Math.floor((item.maxNumber - item.minNumber) / item.increment) + 1;
            displayText = `LJ ${item.minNumber}-${item.maxNumber} (${count} items)`;
        }
        
        queueItemEl.innerHTML = `
            <span class="queue-item-text">${displayText}</span>
            <button class="queue-item-remove" onclick="removeFromQueue(${item.id})">×</button>
        `;
        
        queueList.appendChild(queueItemEl);
    });
}

async function downloadQueue() {
    if (queue.length === 0) {
        alert('Queue is empty. Add items first.');
        return;
    }
    
    // Disable buttons and show progress
    downloadQueueBtn.disabled = true;
    addToQueueBtn.disabled = true;
    progressSection.style.display = 'block';
    progressFill.style.width = '0%';
    statusText.textContent = 'Preparing...';
    
    try {
        await generateQueueFiles();
        statusText.textContent = 'Download complete!';
        clearQueue();
        setTimeout(() => {
            progressSection.style.display = 'none';
        }, 2000);
    } catch (error) {
        alert(`Error: ${error.message}`);
        statusText.textContent = 'Error occurred';
    } finally {
        downloadQueueBtn.disabled = false;
        addToQueueBtn.disabled = false;
    }
}

async function generateQueueFiles() {
    const zip = new JSZip();
    
    // Calculate total items
    let totalItems = 0;
    for (const queueItem of queue) {
        if (queueItem.contentType === 'text') {
            totalItems += 1;
        } else {
            totalItems += Math.floor((queueItem.maxNumber - queueItem.minNumber) / queueItem.increment) + 1;
        }
    }
    
    let processedItems = 0;
    
    // Process each queue item
    for (const queueItem of queue) {
        const materialsFolder = zip.folder(`materials/${queueItem.folderName}`);
        
        let textsToGenerate = [];
        if (queueItem.contentType === 'text') {
            textsToGenerate = [queueItem.text];
        } else {
            for (let i = queueItem.minNumber; i <= queueItem.maxNumber; i += queueItem.increment) {
                textsToGenerate.push(i.toString());
            }
        }
        
        // Generate each text
        for (const text of textsToGenerate) {
            const filename = sanitizeFilename(text);
            
            // Update progress
            processedItems++;
            const progress = (processedItems / totalItems) * 100;
            progressFill.style.width = `${progress}%`;
            statusText.textContent = `Generating ${processedItems}/${totalItems}: ${filename}`;
            
            // Generate image
            const imageBlob = await generateTextImageFromQueue(text, queueItem);
            materialsFolder.file(`${filename}.png`, imageBlob);
            
            // Generate .vmat file
            const vmatContent = generateVmatContent(
                queueItem.shaderType,
                `materials/${queueItem.folderName}/${filename}.png`
            );
            materialsFolder.file(`${filename}.vmat`, vmatContent);
            
            // Small delay to allow UI to update
            await new Promise(resolve => setTimeout(resolve, 10));
        }
    }
    
    // Generate ZIP and download
    statusText.textContent = 'Creating ZIP file...';
    const zipBlob = await zip.generateAsync({ type: 'blob' });
    
    // Download
    const url = URL.createObjectURL(zipBlob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `materials_batch.zip`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
}

function generateTextImageFromQueue(text, queueItem) {
    return new Promise((resolve) => {
        const canvas = document.createElement('canvas');
        canvas.width = queueItem.resolution;
        canvas.height = queueItem.resolution;
        const ctx = canvas.getContext('2d');
        
        // Clear with black background
        ctx.fillStyle = '#000000';
        ctx.fillRect(0, 0, queueItem.resolution, queueItem.resolution);
        
        // Split text into lines
        const lines = text.split('\n');
        const fontSizeScale = queueItem.fontSizeScale / 100;
        
        // Calculate base font size based on resolution and number of lines
        const lineCount = lines.length;
        let baseFontSize = queueItem.resolution / 4;
        
        // Adjust base size for multiple lines to prevent excessive shrinking
        if (lineCount > 1) {
            baseFontSize = Math.min(queueItem.resolution / 4, queueItem.resolution / (lineCount * 0.8));
        }
        
        // First, calculate what the fitted font size would be at 100%
        let fittedFontSize = baseFontSize;
        ctx.font = `bold ${fittedFontSize}px "${queueItem.fontFamily}"`;
        
        // Measure and adjust to fit
        let maxWidth = 0;
        for (const line of lines) {
            const metrics = ctx.measureText(line);
            if (metrics.width > maxWidth) maxWidth = metrics.width;
        }
        
        let lineHeight = fittedFontSize * 1.2;
        let totalHeight = lineHeight * lines.length;
        
        while ((maxWidth > queueItem.resolution * 0.9 || totalHeight > queueItem.resolution * 0.9) && fittedFontSize > 10) {
            fittedFontSize -= 5;
            ctx.font = `bold ${fittedFontSize}px "${queueItem.fontFamily}"`;
            maxWidth = 0;
            for (const line of lines) {
                const metrics = ctx.measureText(line);
                if (metrics.width > maxWidth) maxWidth = metrics.width;
            }
            lineHeight = fittedFontSize * 1.2;
            totalHeight = lineHeight * lines.length;
        }
        
        // Now apply the scale to the fitted size
        const fontSize = fittedFontSize * fontSizeScale;
        ctx.font = `bold ${fontSize}px "${queueItem.fontFamily}"`;
        lineHeight = fontSize * 1.2;
        
        // Set text properties
        ctx.fillStyle = '#FFFFFF';
        ctx.textBaseline = 'middle';
        
        // Set alignment
        let x;
        if (queueItem.alignment === 'left') {
            ctx.textAlign = 'left';
            x = queueItem.resolution * 0.05;
        } else if (queueItem.alignment === 'right') {
            ctx.textAlign = 'right';
            x = queueItem.resolution * 0.95;
        } else {
            ctx.textAlign = 'center';
            x = queueItem.resolution / 2;
        }
        
        // Draw each line
        const totalTextHeight = lineHeight * lines.length;
        let y = (queueItem.resolution - totalTextHeight) / 2 + lineHeight / 2;
        
        for (const line of lines) {
            ctx.fillText(line, x, y);
            y += lineHeight;
        }
        
        // Convert to blob
        canvas.toBlob((blob) => {
            resolve(blob);
        }, 'image/png');
    });
}

async function generateFiles() {
    const zip = new JSZip();
    const contentType = document.querySelector('input[name="content-type"]:checked').value;
    const shaderType = shaderTypeSelect.value;
    const resolution = parseInt(resolutionSelect.value);
    const fontFamily = fontSelect.value;
    const alignment = alignmentSelect.value;
    const folderName = 'fuckpointworldtext';
    
    // Get list of texts to generate
    let textsToGenerate = [];
    
    if (contentType === 'text') {
        textsToGenerate = [textInput.value];
    } else {
        const min = parseInt(minNumberInput.value);
        const max = parseInt(maxNumberInput.value);
        const increment = parseInt(incrementInput.value);
        
        for (let i = min; i <= max; i += increment) {
            textsToGenerate.push(i.toString());
        }
    }
    
    const totalItems = textsToGenerate.length;
    
    // Create folder in ZIP
    const materialsFolder = zip.folder(`materials/${folderName}`);
    
    // Generate each text
    for (let i = 0; i < textsToGenerate.length; i++) {
        const text = textsToGenerate[i];
        const filename = sanitizeFilename(text);
        
        // Update progress
        const progress = ((i + 1) / totalItems) * 100;
        progressFill.style.width = `${progress}%`;
        statusText.textContent = `Generating ${i + 1}/${totalItems}: ${filename}`;
        
        // Generate image
        const imageBlob = await generateTextImage(text, resolution, fontFamily, alignment);
        materialsFolder.file(`${filename}.png`, imageBlob);
        
        // Generate .vmat file
        const vmatContent = generateVmatContent(
            shaderType,
            `materials/${folderName}/${filename}.png`
        );
        materialsFolder.file(`${filename}.vmat`, vmatContent);
        
        // Small delay to allow UI to update
        await new Promise(resolve => setTimeout(resolve, 10));
    }
    
    // Generate ZIP and download
    statusText.textContent = 'Creating ZIP file...';
    const zipBlob = await zip.generateAsync({ type: 'blob' });
    
    // Download
    const url = URL.createObjectURL(zipBlob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${folderName}.zip`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
}

function generateTextImage(text, resolution, fontFamily, alignment) {
    return new Promise((resolve) => {
        const canvas = document.createElement('canvas');
        canvas.width = resolution;
        canvas.height = resolution;
        const ctx = canvas.getContext('2d');
        
        // Clear with black background
        ctx.fillStyle = '#000000';
        ctx.fillRect(0, 0, resolution, resolution);
        
        // Split text into lines
        const lines = text.split('\n');
        const fontSizeScale = parseInt(fontSizeSlider.value) / 100;
        
        // Calculate base font size based on resolution and number of lines
        const lineCount = lines.length;
        let baseFontSize = resolution / 4;
        
        // Adjust base size for multiple lines to prevent excessive shrinking
        if (lineCount > 1) {
            baseFontSize = Math.min(resolution / 4, resolution / (lineCount * 0.8));
        }
        
        // First, calculate what the fitted font size would be at 100%
        let fittedFontSize = baseFontSize;
        ctx.font = `bold ${fittedFontSize}px "${fontFamily}"`;
        
        // Measure and adjust to fit
        let maxWidth = 0;
        for (const line of lines) {
            const metrics = ctx.measureText(line);
            if (metrics.width > maxWidth) maxWidth = metrics.width;
        }
        
        let lineHeight = fittedFontSize * 1.2;
        let totalHeight = lineHeight * lines.length;
        
        while ((maxWidth > resolution * 0.9 || totalHeight > resolution * 0.9) && fittedFontSize > 10) {
            fittedFontSize -= 5;
            ctx.font = `bold ${fittedFontSize}px "${fontFamily}"`;
            maxWidth = 0;
            for (const line of lines) {
                const metrics = ctx.measureText(line);
                if (metrics.width > maxWidth) maxWidth = metrics.width;
            }
            lineHeight = fittedFontSize * 1.2;
            totalHeight = lineHeight * lines.length;
        }
        
        // Now apply the scale to the fitted size
        const fontSize = fittedFontSize * fontSizeScale;
        ctx.font = `bold ${fontSize}px "${fontFamily}"`;
        lineHeight = fontSize * 1.2;
        
        // Set text properties
        ctx.fillStyle = '#FFFFFF';
        ctx.textBaseline = 'middle';
        
        // Set alignment
        let x;
        if (alignment === 'left') {
            ctx.textAlign = 'left';
            x = resolution * 0.05;
        } else if (alignment === 'right') {
            ctx.textAlign = 'right';
            x = resolution * 0.95;
        } else {
            ctx.textAlign = 'center';
            x = resolution / 2;
        }
        
        // Draw each line
        const totalTextHeight = lineHeight * lines.length;
        let y = (resolution - totalTextHeight) / 2 + lineHeight / 2;
        
        for (const line of lines) {
            ctx.fillText(line, x, y);
            y += lineHeight;
        }
        
        // Convert to blob
        canvas.toBlob((blob) => {
            resolve(blob);
        }, 'image/png');
    });
}

function generateVmatContent(shaderType, texturePath) {
    if (shaderType === 'static') {
        return `// THIS FILE IS AUTO-GENERATED

Layer0
{
	shader "csgo_static_overlay.vfx"

	//---- Blend Mode ----
	F_BLEND_MODE 1 // Translucent

	//---- Color ----
	g_flModelTintAmount "1.000"
	g_flTexCoordRotation "0.000"
	g_fTextureColorBrightness "1.000"
	g_fTextureColorContrast "1.000"
	g_fTextureColorSaturation "1.000"
	g_nScaleTexCoordUByModelScaleAxis "0" // None
	g_nScaleTexCoordVByModelScaleAxis "0" // None
	g_vColorTint "[1.000000 1.000000 1.000000 0.000000]"
	g_vTexCoordCenter "[0.500 0.500]"
	g_vTexCoordOffset "[0.000 0.000]"
	g_vTexCoordScale "[1.000 1.000]"
	g_vTexCoordScrollSpeed "[0.000 0.000]"
	g_vTextureColorCorrectionTint "[1.000000 1.000000 1.000000 0.000000]"
	TextureColor "${texturePath}"

	//---- Fog ----
	g_bFogEnabled "1"

	//---- Texture Address Mode ----
	g_nTextureAddressModeU "0" // Wrap
	g_nTextureAddressModeV "0" // Wrap

	//---- Translucent ----
	g_flOpacityScale "1.000"
	TextureTranslucency "${texturePath}"


	VariableState
	{
		"Color"
		{
			"Color Correction" 0
		}
		"Fog"
		{
		}
		"Texture Address Mode"
		{
		}
		"Translucent"
		{
		}
	}
}`;
    } else {
        return `// THIS FILE IS AUTO-GENERATED

Layer0
{
	shader "csgo_complex.vfx"

	//---- Translucent ----
	F_TRANSLUCENT 1

	//---- Ambient Occlusion ----
	TextureAmbientOcclusion "materials/default/default_ao.tga"

	//---- Color ----
	g_flModelTintAmount "1.000"
	g_flTexCoordRotation "0.000"
	g_nScaleTexCoordUByModelScaleAxis "0" // None
	g_nScaleTexCoordVByModelScaleAxis "0" // None
	g_vColorTint "[1.000000 1.000000 1.000000 0.000000]"
	g_vTexCoordCenter "[0.500 0.500]"
	g_vTexCoordOffset "[0.000 0.000]"
	g_vTexCoordScale "[1.000 1.000]"
	g_vTexCoordScrollSpeed "[0.000 0.000]"
	TextureColor "${texturePath}"

	//---- Fog ----
	g_bFogEnabled "1"

	//---- Lighting ----
	g_flMetalness "0.000"
	TextureRoughness "materials/default/default_rough.tga"

	//---- Normal Map ----
	TextureNormal "materials/default/default_normal.tga"

	//---- Texture Address Mode ----
	g_nTextureAddressModeU "0" // Wrap
	g_nTextureAddressModeV "0" // Wrap

	//---- Translucent ----
	g_flOpacityScale "1.000"
	TextureTranslucency "${texturePath}"


	VariableState
	{
		"Ambient Occlusion"
		{
		}
		"Color"
		{
		}
		"Fog"
		{
		}
		"Lighting"
		{
			"Roughness" 0
			"Metalness" 0
		}
		"Normal Map"
		{
		}
		"Texture Address Mode"
		{
		}
		"Translucent"
		{
		}
	}
}`;
    }
}

function sanitizeFilename(filename) {
    // Remove invalid characters and replace spaces with underscores
    return filename
        .replace(/[<>:"/\\|?*]/g, '')
        .replace(/\s+/g, '_')
        .replace(/[^\x20-\x7E]/g, '') // Remove non-printable characters
        .trim();
}
