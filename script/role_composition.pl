use strict;
use uni::perl;

{
    package TestRole;
    use uni::perl;
    use Moose::Role;
    
    before say => sub { say 'from role' }
    
}

{
    package TestClass::Before;    
    use uni::perl;
    use Moose;
    
    with 'TestRole';
    
    sub say { say 'from Class (before)' }
    
}

{
    package TestClass::After;
    use uni::perl;
    use Moose;
    
    sub say { say 'from Class (after)' }
    
    with 'TestRole';
    
}

TestClass::Before->new->say;
TestClass::After->new->say;