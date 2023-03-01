import type * as types from '@babel/types';
import type { NodePath } from '@babel/core';

export default (babel: any) => {
  const t: typeof types = babel.types;
  return {
    name: 'beautifier',
    visitor: {
      /**
       *   var a, b, c = 1, d = 2;
       * =>
       *   var a, b;
       *   var c = 1;
       *   var d = 2;
       */
      VariableDeclaration(path: NodePath<types.VariableDeclaration>) {
        const { declarations, kind } = path.node;
        if (declarations.length <= 1) {
          return;
        }

        /**
         * Extract declarations from ForStatement
         *
         *   for (var a, b = 0; b < 10; b++);
         * =>
         *   var a;
         *   for (var b = 0; b < 10; b++);
         */
        if (path.parentPath.isForStatement() && path.key === 'init') {
          path.parentPath.insertBefore(t.variableDeclaration(kind, declarations.slice(0, -1)));
          path.replaceWith(t.variableDeclaration(kind, declarations.slice(-1)));
          return;
        }

        const emptyDeclarators: types.VariableDeclarator[] = [];
        const nonEmptyDeclarators: types.VariableDeclarator[] = [];

        declarations.forEach((decl) => {
          if (decl.init) {
            nonEmptyDeclarators.push(decl);
          } else {
            emptyDeclarators.push(decl);
          }
        });

        if (!nonEmptyDeclarators.length) {
          return;
        }

        if (emptyDeclarators.length) {
          path.insertBefore(t.variableDeclaration(kind, emptyDeclarators));
        }
        path.replaceWithMultiple(
          nonEmptyDeclarators.map((dec) => t.variableDeclaration(kind, [dec])),
        );
      },

      /**
       *   for (...) expression;
       * =>
       *   for (...) {
       *     expression;
       *   }
       */
      ForStatement(path) {
        if (!path.get('body').isBlockStatement()) {
          path.set('body', t.blockStatement([path.get('body').node]));
        }
      },

      /**
       *   return a, b;
       * =>
       *   a;
       *   return b;
       */
      SequenceExpression(path: NodePath<types.SequenceExpression>) {
        const exprs = path.node.expressions;
        const { parentPath } = path;

        if (!parentPath.isStatement()) {
          return;
        }
        parentPath.insertBefore(
          exprs.slice(0, -1).map((exp) => t.expressionStatement(exp)),
        );
        path.replaceWith(exprs[exprs.length - 1]);
      },

      /**
       *   a && b; => if (a) b;
       *
       *   a || b; => if (!a) b;
       */
      LogicalExpression(path: NodePath<types.LogicalExpression>) {
        const { operator, left, right } = path.node;
        const { parentPath } = path;

        if (!parentPath.isExpressionStatement()) {
          return;
        }

        if (operator === '&&') {
          parentPath.replaceWith(t.ifStatement(left, t.expressionStatement(right)));
        } else {
          parentPath.replaceWith(t.ifStatement(t.unaryExpression('!', left), t.expressionStatement(right)));
        }
      },

      UnaryExpression(path: NodePath<types.UnaryExpression>) {
        const { operator, argument } = path.node;
        const { parentPath } = path;

        /**
         *   !0 => true
         *
         *   !1 => false
         */
        if (operator === '!' && argument.type === 'NumericLiteral') {
          if (argument.value === 0) {
            path.replaceWith(t.booleanLiteral(true));
          } else {
            path.replaceWith(t.booleanLiteral(false));
          }
          return;
        }

        if (operator !== 'void') {
          return;
        }

        /**
         *   void 0;
         * =>
         *   undefined;
         */
        if (path.get('argument').isLiteral()) {
          path.replaceWith(t.identifier('undefined'));
          return;
        }

        if (!parentPath.isStatement()) {
          return;
        }

        /**
         *   return void x;
         * =>
         *   x;
         *   return;
         */
        parentPath.insertBefore(t.expressionStatement(argument));

        if (parentPath.isReturnStatement()) {
          path.remove();
        } else {
          path.replaceWith(t.identifier('undefined'));
        }
      },

      ConditionalExpression(path: NodePath<types.ConditionalExpression>) {
        const { test, consequent, alternate } = path.node;
        const { parentPath } = path;

        /**
         *   val = condition ? a : b;
         * =>
         *   if (condition) {
         *     val = a;
         *   } else {
         *     val = b;
         *   }
         */
        if (parentPath.isAssignmentExpression() && parentPath.parentPath.isExpressionStatement()) {
          const { operator, left } = parentPath.node;
          parentPath.parentPath.replaceWith(
            t.ifStatement(
              test,
              t.expressionStatement(t.assignmentExpression(operator, left, consequent)),
              t.expressionStatement(t.assignmentExpression(operator, left, alternate)),
            ),
          );
          return;
        }

        /**
         *   return condition ? a : b;
         * =>
         *   if (condition) {
         *     return a;
         *   } else {
         *     return b;
         *   }
         */
        if (parentPath.isReturnStatement()) {
          parentPath.replaceWith(
            t.ifStatement(
              test,
              t.returnStatement(consequent),
              t.returnStatement(alternate),
            ),
          );
          return;
        }

        /**
         *   condition ? a : b
         * =>
         *   if (condition) {
         *     a;
         *   } else {
         *     b;
         *   }
         */
        if (parentPath.isExpressionStatement()) {
          parentPath.replaceWith(
            t.ifStatement(
              test,
              t.expressionStatement(consequent),
              t.expressionStatement(alternate),
            ),
          );
        }
      },

      /**
       *   { a: function a() {} };
       * =>
       *   { a() {} };
       */
      ObjectProperty(path: NodePath<types.ObjectProperty>) {
        const { key, value, computed } = path.node;

        if (value.type === 'FunctionExpression' && key.type !== 'PrivateName') {
          path.replaceWith(t.objectMethod('method', key, value.params, value.body, computed));
        }
      },

      /**
       *   if (...) a;
       * =>
       *   if (...) {
       *     a;
       *   }
       */
      IfStatement(path: NodePath<types.IfStatement>) {
        const { consequent, alternate } = path.node;

        if (consequent.type !== 'BlockStatement') {
          path.set('consequent', t.blockStatement([consequent]));
        }

        if (!alternate) {
          return;
        }
        if (alternate.type === 'BlockStatement' || alternate.type === 'IfStatement') {
          return;
        }
        if (alternate.type === 'ExpressionStatement') {
          const expr = alternate.expression;
          /**
           *   if (xxx) xxx else a ? b : c;
           * =>
           *   if (xxx) {
           *     xxx;
           *   } else if (a) {
           *     b;
           *   } else {
           *     c;
           *   }
           */
          if (expr.type === 'ConditionalExpression') {
            return;
          }
          /**
           *   if (xxx) xxx else a && b;
           * =>
           *   if (xxx) {
           *     xxx;
           *   } else if (a) {
           *     b;
           *   }
           */
          if (expr.type === 'LogicalExpression') {
            return;
          }
          /**
           *   if (xxx) xxx else a = b ? c : d;
           * =>
           *   if (xxx) {
           *     xxx;
           *   } else if (b) {
           *     a = c;
           *   } else {
           *     a = d;
           *   }
           */
          if (expr.type === 'AssignmentExpression' && expr.right.type === 'ConditionalExpression') {
            return;
          }
        }
        path.set('alternate', t.blockStatement([alternate]));
      },

      CallExpression: {
        exit(path: NodePath<types.CallExpression>) {
          const { callee } = path.node;
          if (callee.type !== 'MemberExpression') {
            return;
          }
          if (callee.property.type !== 'Identifier') {
            return;
          }
          if (callee.property.name !== 'concat') {
            return;
          }
          if (path.node.arguments.length !== 1) {
            return;
          }
          const [arg] = path.node.arguments;
          if (!t.isExpression(arg)) {
            return;
          }
          /**
           *   'string'.concat(str)
           * =>
           *   `string${str}`
           */
          if (callee.object.type === 'StringLiteral') {
            if (arg.type === 'StringLiteral') {
              path.replaceWith(
                t.stringLiteral(callee.object.value + arg.value),
              );
              return;
            }
            const { value } = callee.object;
            path.replaceWith(
              t.templateLiteral([
                t.templateElement({ raw: value, cooked: value }),
                t.templateElement({ raw: '', cooked: '' }, true),
              ], [
                arg,
              ]),
            );
            return;
          }
          if (callee.object.type !== 'TemplateLiteral') {
            return;
          }
          const lastQuasis = callee.object.quasis[callee.object.quasis.length - 1];
          if (arg.type === 'StringLiteral') {
            /**
             *   `template ${literal}`.concat(' tail')
             * =>
             *   `template ${literal} tail`
             */
            lastQuasis.value.raw += arg.value;
            if (lastQuasis.value.cooked) {
              lastQuasis.value.raw += arg.value;
            }
            path.replaceWith(callee.object);
          } else {
            /**
             *   `template ${literal}`.concat(value)
             * =>
             *   `template ${literal}${value}`
             */
            lastQuasis.tail = false;
            callee.object.quasis.push(
              t.templateElement({ raw: '', cooked: '' }, true),
            );
            callee.object.expressions.push(arg);
          }
          path.replaceWith(callee.object);
        },
      },
    },
  };
};
