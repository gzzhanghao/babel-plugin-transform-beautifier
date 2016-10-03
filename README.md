# babel-plugin-transform-beautifier

A babel plugin that beautifies JavaScripts

## Usage

```bash
npm i --save-dev babel-plugin-transform-beautifier
```

Then add the plugin to your babel config:

```javascript
{
  plugins: ['transform-beautifier'],
}
```

## Example

The following code:

```javascript
testA ? consequent() : testB && alternate()
```

Will be transformed to:

```javascript
if (testA) {
  consequent()
} else if (testB) {
  alternate()
}
```
