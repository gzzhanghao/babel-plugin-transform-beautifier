'use strict'

module.exports = babel => {
  const t = babel.types
  return {
    visitor: {

      VariableDeclaration(path) {
        const { declarations, kind } = path.node
        if (path.parentPath.isForStatement()) {
          return
        }

        const emptyDeclarator = []
        const nonEmptyDeclarator = declarations.filter(dec => {
          if (dec.init) {
            return true
          }
          emptyDeclarator.push(dec)
        })

        if (nonEmptyDeclarator.length <= 1) {
          return
        }
        if (emptyDeclarator.length) {
          path.insertBefore(t.variableDeclaration(kind, emptyDeclarator))
        }
        path.replaceWithMultiple(nonEmptyDeclarator.map(dec => t.variableDeclaration(kind, [dec])))
      },

      ForStatement(path) {
        if (!path.get('body').isBlockStatement()) {
          path.set('body', t.blockStatement([path.get('body').node]))
        }
      },

      SequenceExpression(path) {
        const exprs = path.node.expressions
        const parentPath = path.parentPath

        if (parentPath.isStatement()) {
          parentPath.insertBefore(exprs.slice(0, -1).map(exp => t.expressionStatement(exp)))
          path.replaceWith(exprs[exprs.length - 1])
        }
      },

      LogicalExpression(path) {
        const { operator, left, right } = path.node
        const parentPath = path.parentPath

        if (!parentPath.isExpressionStatement()) {
          return
        }

        if (operator === '&&') {
          parentPath.replaceWith(t.ifStatement(left, t.expressionStatement(right)))
        } else {
          parentPath.replaceWith(t.ifStatement(t.unaryExpression('!', left), t.expressionStatement(right)))
        }
      },

      UnaryExpression(path) {
        const { operator, argument } = path.node
        const parentPath = path.parentPath

        if (operator === '!' && path.get('argument').isNumericLiteral()) {
          if (argument.value === 0) {
            path.replaceWith(t.booleanLiteral(true))
          } else {
            path.replaceWith(t.booleanLiteral(false))
          }
          return
        }

        if (operator !== 'void' || !parentPath.isStatement()) {
          return
        }

        parentPath.insertBefore(t.expressionStatement(argument))

        if (parentPath.isReturnStatement()) {
          path.remove()
        } else {
          path.replaceWith(t.identifier('undefined'))
        }
      },

      ConditionalExpression(path) {
        const { test, consequent, alternate } = path.node
        const parentPath = path.parentPath

        if (parentPath.isAssignmentExpression() && parentPath.parentPath.isExpressionStatement()) {
          const { operator, left } = parentPath.node
          parentPath.parentPath.replaceWith(
            t.ifStatement(test,
              t.expressionStatement(t.assignmentExpression(operator, left, consequent)),
              t.expressionStatement(t.assignmentExpression(operator, left, alternate))
            )
          )
          return
        }

        if (parentPath.isReturnStatement()) {
          parentPath.replaceWith(t.ifStatement(test, t.returnStatement(consequent), t.returnStatement(alternate)))
          return
        }
        if (parentPath.isExpressionStatement()) {
          parentPath.replaceWith(t.ifStatement(test, t.expressionStatement(consequent), t.expressionStatement(alternate)))
          return
        }
      },

      ObjectProperty(path) {
        const { key, value, computed } = path.node

        if (!path.get('value').isFunctionExpression()) {
          return
        }
        path.replaceWith(t.objectMethod('method', key, value.params, value.body, computed))
      },

      IfStatement(path) {
        const consequent = path.get('consequent')
        const alternate = path.get('alternate')

        if (!consequent.isBlockStatement()) {
          path.set('consequent', t.blockStatement([consequent.node]))
        }

        if (!alternate.node) {
          return
        }
        if (alternate.isBlockStatement() || alternate.isIfStatement()) {
          return
        }
        if (alternate.isExpressionStatement()) {
          const expr = alternate.get('expression')
          if (expr.isConditionalExpression()) {
            return
          }
          if (expr.isLogicalExpression()) {
            return
          }
          if (expr.isAssignmentExpression() && expr.get('right').isConditionalExpression()) {
            return
          }
        }
        path.set('alternate', t.blockStatement([alternate.node]))
      },
    },
  }
}
