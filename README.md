# PHI-SERVER
This is a sample NestJS application using Australian private health insurance (PHI) data to demonstrate building applications with NestJS.

## Development Notes
This installation uses better-sqlite3, however, other SQL databases should work with little or no modification. 

1. Create an empty project directory.  
⚠️ If using WebStorm, ensure you select the "Empty Project" option.  Otherwise, later commands might fail.

2. Run ```nest new .``` to create the template app.

3. In addition to the default packages, install the following: 
    ```
    npm i class-validator class-transformer
    npm i @nestjs/mapped-types
    npm i @nestjs/typeorm typeorm better-sqlite3
    ```
4. Tab-width changed to 4 in ```.prettierrc```.